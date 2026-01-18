/**
 * Menu Import Service
 *
 * Service facade for menu import operations.
 */

import type { Database } from "@menuvo/db";
import { menuImportJobs, stores } from "@menuvo/db/schema";
import { and, eq } from "drizzle-orm";
import { uploadFile } from "../../../infrastructure/storage/files-client.js";
import { DomainError } from "../../errors.js";
import type { IMenuImportService } from "./interface.js";
import { processMenuImportJob } from "./processor.js";
import type {
	AllowedFileType,
	ApplyImportChangesInput,
	ApplyImportChangesResult,
	GetImportJobStatusInput,
	ImportJobStatus,
	ImportJobStatusValue,
	UploadImportFileInput,
	UploadImportFileResult,
} from "./types.js";
import { allowedFileTypes, isImportJobStatus } from "./types.js";

// MIME type mapping for file type detection
const MIME_TYPE_MAP: Record<string, AllowedFileType> = {
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
	"application/vnd.ms-excel": "xlsx",
	"text/csv": "csv",
	"application/json": "json",
	"text/markdown": "md",
	"text/plain": "txt",
};

function resolveImportJobStatus(value: string): ImportJobStatusValue {
	if (isImportJobStatus(value)) {
		return value;
	}
	throw new DomainError("VALIDATION", `Invalid import job status: ${value}`);
}

/**
 * Menu import service implementation
 */
export class MenuImportService implements IMenuImportService {
	private readonly db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async uploadFile(
		merchantId: string,
		input: UploadImportFileInput,
	): Promise<UploadImportFileResult> {
		const { file, storeId } = input;

		// Verify store belongs to merchant
		const store = await this.db.query.stores.findFirst({
			where: and(eq(stores.id, storeId), eq(stores.merchantId, merchantId)),
			columns: { id: true },
		});

		if (!store) {
			throw new DomainError("NOT_FOUND", "Store not found");
		}

		// Determine file type from mime type or extension
		let fileType: AllowedFileType | undefined = MIME_TYPE_MAP[file.type];

		if (!fileType) {
			// Try to get from filename extension
			const ext = file.name.split(".").pop()?.toLowerCase();
			if (ext && allowedFileTypes.includes(ext as AllowedFileType)) {
				fileType = ext as AllowedFileType;
			}
		}

		if (!fileType) {
			throw new DomainError(
				"VALIDATION",
				`Unsupported file type: ${file.type}. Allowed types: ${allowedFileTypes.join(", ")}`,
			);
		}

		// Read file content
		const buffer = Buffer.from(await file.arrayBuffer());

		// Generate storage key
		const fileKey = `imports/${storeId}/${crypto.randomUUID()}.${fileType}`;

		// Upload to S3
		await uploadFile(fileKey, buffer, { type: file.type });

		// Create import job in database
		const [job] = await this.db
			.insert(menuImportJobs)
			.values({
				storeId,
				originalFilename: file.name,
				fileType,
				fileKey,
				status: "PROCESSING",
			})
			.returning();

		if (!job) {
			throw new Error("Failed to create import job");
		}

		// Trigger background processing (fire and forget)
		processMenuImportJob(job.id).catch((error) => {
			console.error(
				`[menu.import.service] Background processing failed for job ${job.id}:`,
				error,
			);
		});

		return {
			jobId: job.id,
			status: resolveImportJobStatus(job.status),
		};
	}

	async getJobStatus(
		merchantId: string,
		input: GetImportJobStatusInput,
	): Promise<ImportJobStatus> {
		const job = await this.db.query.menuImportJobs.findFirst({
			where: eq(menuImportJobs.id, input.jobId),
			with: {
				store: {
					columns: { merchantId: true },
				},
			},
		});

		if (!job) {
			throw new DomainError("NOT_FOUND", "Import job not found");
		}

		// Verify ownership via store
		if (job.store.merchantId !== merchantId) {
			throw new DomainError(
				"FORBIDDEN",
				"You do not have permission to view this import job",
			);
		}

		return {
			id: job.id,
			storeId: job.storeId,
			originalFilename: job.originalFilename,
			fileType: job.fileType,
			status: resolveImportJobStatus(job.status),
			errorMessage: job.errorMessage,
			comparisonData: job.comparisonData as ImportJobStatus["comparisonData"],
			createdAt: job.createdAt,
		};
	}

	async applyChanges(
		merchantId: string,
		input: ApplyImportChangesInput,
	): Promise<ApplyImportChangesResult> {
		// Verify the store belongs to the merchant
		const store = await this.db.query.stores.findFirst({
			where: and(
				eq(stores.id, input.storeId),
				eq(stores.merchantId, merchantId),
			),
			columns: { id: true },
		});

		if (!store) {
			throw new DomainError("NOT_FOUND", "Store not found");
		}

		// Get the import job
		const job = await this.db.query.menuImportJobs.findFirst({
			where: and(
				eq(menuImportJobs.id, input.jobId),
				eq(menuImportJobs.storeId, input.storeId),
			),
		});

		if (!job) {
			throw new DomainError("NOT_FOUND", "Import job not found");
		}

		// Ensure job is in READY status
		if (job.status !== "READY") {
			throw new DomainError(
				"VALIDATION",
				`Import job is not ready for application. Current status: ${job.status}`,
			);
		}

		// Filter to only selections with "apply" action
		const selectionsToApply = input.selections.filter(
			(s) => s.action === "apply",
		);

		if (selectionsToApply.length === 0) {
			// No selections to apply, just mark as completed
			await this.db
				.update(menuImportJobs)
				.set({ status: "COMPLETED" })
				.where(eq(menuImportJobs.id, input.jobId));

			return {
				success: true,
				applied: {
					categories: 0,
					items: 0,
					optionGroups: 0,
				},
			};
		}

		// Count selections by type
		const categoriesCount = selectionsToApply.filter(
			(s) => s.type === "category",
		).length;
		const itemsCount = selectionsToApply.filter(
			(s) => s.type === "item",
		).length;
		const optionGroupsCount = selectionsToApply.filter(
			(s) => s.type === "optionGroup",
		).length;

		// TODO: Implement actual entity creation/updates based on comparisonData
		// This would involve:
		// 1. Parsing the comparisonData to get full entity details
		// 2. For each "apply" selection:
		//    - If matchedEntityId exists: update the existing entity
		//    - If no matchedEntityId: create a new entity
		// 3. Handle translations, prices, option groups, etc.

		// For now, mark the job as completed
		await this.db
			.update(menuImportJobs)
			.set({ status: "COMPLETED" })
			.where(eq(menuImportJobs.id, input.jobId));

		return {
			success: true,
			applied: {
				categories: categoriesCount,
				items: itemsCount,
				optionGroups: optionGroupsCount,
			},
		};
	}
}
