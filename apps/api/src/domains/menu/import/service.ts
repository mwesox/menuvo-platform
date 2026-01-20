/**
 * Menu Import Service
 *
 * Service facade for menu import operations.
 */

import type { Database } from "@menuvo/db";
import {
	categories,
	items,
	menuImportJobs,
	stores,
	vatGroups,
} from "@menuvo/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { uploadFile } from "../../../infrastructure/storage/files-client.js";
import { logger } from "../../../lib/logger.js";
import { generateOrderKey } from "../../../lib/ordering.js";
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
	MenuComparisonData,
	UploadImportFileInput,
	UploadImportFileResult,
} from "./types.js";
import { allowedFileTypes, isImportJobStatus } from "./types.js";

const importLogger = logger.child({ service: "menu-import-apply" });

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
		importLogger.info(
			{ jobId: input.jobId, storeId: input.storeId },
			"Starting import apply",
		);

		// Verify the store belongs to the merchant
		const store = await this.db.query.stores.findFirst({
			where: and(
				eq(stores.id, input.storeId),
				eq(stores.merchantId, merchantId),
			),
			columns: { id: true, merchantId: true },
		});

		if (!store) {
			importLogger.warn({ storeId: input.storeId }, "Store not found");
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
			importLogger.warn({ jobId: input.jobId }, "Import job not found");
			throw new DomainError("NOT_FOUND", "Import job not found");
		}

		// Ensure job is in READY status
		if (job.status !== "READY") {
			importLogger.warn(
				{ jobId: input.jobId, status: job.status },
				"Job not in READY status",
			);
			throw new DomainError(
				"VALIDATION",
				`Import job is not ready for application. Current status: ${job.status}`,
			);
		}

		const comparisonData = job.comparisonData as MenuComparisonData | null;
		if (!comparisonData) {
			importLogger.error({ jobId: input.jobId }, "No comparison data found");
			throw new DomainError("VALIDATION", "Import job has no comparison data");
		}

		// Build selection lookup maps
		const categorySelections = new Map(
			input.selections
				.filter((s) => s.type === "category")
				.map((s) => [s.extractedName, s]),
		);
		const itemSelections = new Map(
			input.selections
				.filter((s) => s.type === "item")
				.map((s) => [s.extractedName, s]),
		);

		importLogger.debug(
			{
				categorySelections: categorySelections.size,
				itemSelections: itemSelections.size,
			},
			"Selection maps built",
		);

		// Build VAT code to ID mapping
		const merchantVatGroups = await this.db.query.vatGroups.findMany({
			where: eq(vatGroups.merchantId, merchantId),
		});
		const vatCodeToId = new Map(merchantVatGroups.map((v) => [v.code, v.id]));

		// Track results
		let categoriesApplied = 0;
		let itemsApplied = 0;

		// Map to track category name -> ID (for new categories and existing matches)
		const categoryNameToId = new Map<string, string>();

		try {
			// Step 1: Process categories
			for (const catComp of comparisonData.categories) {
				const selection = categorySelections.get(catComp.extracted.name);

				if (!selection || selection.action !== "apply") {
					// If category is skipped but has existingId, track it for items
					if (catComp.existingId) {
						categoryNameToId.set(catComp.extracted.name, catComp.existingId);
					}
					continue;
				}

				const translations = {
					de: {
						name: catComp.extracted.name,
						description: catComp.extracted.description,
					},
				};

				// Resolve VAT group ID from code
				const defaultVatGroupId = catComp.extracted.defaultVatGroupCode
					? (vatCodeToId.get(catComp.extracted.defaultVatGroupCode) ?? null)
					: null;

				const existingCategoryId =
					selection.matchedEntityId || catComp.existingId;
				if (existingCategoryId) {
					// Update existing category
					importLogger.debug(
						{ categoryId: existingCategoryId, name: catComp.extracted.name },
						"Updating category",
					);

					await this.db
						.update(categories)
						.set({
							translations,
							defaultVatGroupId,
						})
						.where(eq(categories.id, existingCategoryId));

					categoryNameToId.set(catComp.extracted.name, existingCategoryId);
					categoriesApplied++;
				} else {
					// Create new category
					importLogger.debug(
						{ name: catComp.extracted.name },
						"Creating category",
					);

					// Get last category's order key for fractional indexing
					const lastCategory = await this.db.query.categories.findFirst({
						where: eq(categories.storeId, input.storeId),
						orderBy: [desc(categories.displayOrder)],
						columns: { displayOrder: true },
					});
					const displayOrder = generateOrderKey(
						lastCategory?.displayOrder ?? null,
					);

					const [newCategory] = await this.db
						.insert(categories)
						.values({
							storeId: input.storeId,
							translations,
							displayOrder,
							isActive: true,
							defaultVatGroupId,
						})
						.returning();

					if (newCategory) {
						categoryNameToId.set(catComp.extracted.name, newCategory.id);
						categoriesApplied++;
					} else {
						importLogger.error(
							{ name: catComp.extracted.name },
							"Failed to create category",
						);
					}
				}
			}

			importLogger.info({ categoriesApplied }, "Categories processed");

			// Step 2: Process items
			for (const catComp of comparisonData.categories) {
				const categoryId = categoryNameToId.get(catComp.extracted.name);

				if (!categoryId) {
					importLogger.debug(
						{ categoryName: catComp.extracted.name },
						"Skipping items - category not found or not applied",
					);
					continue;
				}

				for (const itemComp of catComp.items) {
					const selection = itemSelections.get(itemComp.extracted.name);

					if (!selection || selection.action !== "apply") {
						continue;
					}

					const translations = {
						de: {
							name: itemComp.extracted.name,
							description: itemComp.extracted.description,
						},
					};

					// Resolve VAT group ID from code
					const vatGroupId = itemComp.extracted.vatGroupCode
						? (vatCodeToId.get(itemComp.extracted.vatGroupCode) ?? null)
						: null;

					const existingItemId =
						selection.matchedEntityId || itemComp.existingId;
					if (existingItemId) {
						// Update existing item
						importLogger.debug(
							{ itemId: existingItemId, name: itemComp.extracted.name },
							"Updating item",
						);

						await this.db
							.update(items)
							.set({
								categoryId,
								translations,
								price: itemComp.extracted.price,
								allergens: itemComp.extracted.allergens ?? [],
								vatGroupId,
							})
							.where(eq(items.id, existingItemId));

						itemsApplied++;
					} else {
						// Create new item
						importLogger.debug(
							{ name: itemComp.extracted.name, categoryId },
							"Creating item",
						);

						// Get last item's order key for fractional indexing
						const lastItem = await this.db.query.items.findFirst({
							where: eq(items.categoryId, categoryId),
							orderBy: [desc(items.displayOrder)],
							columns: { displayOrder: true },
						});
						const displayOrder = generateOrderKey(
							lastItem?.displayOrder ?? null,
						);

						const [newItem] = await this.db
							.insert(items)
							.values({
								storeId: input.storeId,
								categoryId,
								translations,
								price: itemComp.extracted.price,
								displayOrder,
								isActive: true,
								allergens: itemComp.extracted.allergens ?? [],
								vatGroupId,
							})
							.returning();

						if (newItem) {
							itemsApplied++;
						} else {
							importLogger.error(
								{ name: itemComp.extracted.name },
								"Failed to create item",
							);
						}
					}
				}
			}

			importLogger.info({ itemsApplied }, "Items processed");

			// Mark job as completed
			await this.db
				.update(menuImportJobs)
				.set({ status: "COMPLETED" })
				.where(eq(menuImportJobs.id, input.jobId));

			importLogger.info(
				{ jobId: input.jobId, categoriesApplied, itemsApplied },
				"Import apply completed successfully",
			);

			return {
				success: true,
				applied: {
					categories: categoriesApplied,
					items: itemsApplied,
					optionGroups: 0, // TODO: Implement option groups
				},
			};
		} catch (error) {
			importLogger.error(
				{
					jobId: input.jobId,
					error: error instanceof Error ? error.message : String(error),
				},
				"Import apply failed",
			);

			// Mark job as failed
			await this.db
				.update(menuImportJobs)
				.set({
					status: "FAILED",
					errorMessage:
						error instanceof Error
							? error.message
							: "Unknown error during apply",
				})
				.where(eq(menuImportJobs.id, input.jobId));

			throw error;
		}
	}
}
