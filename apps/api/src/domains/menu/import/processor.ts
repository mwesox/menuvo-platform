/**
 * Menu Import Processor
 *
 * Processes menu import jobs: extracts text, runs AI, compares with existing menu.
 */

import { db } from "@menuvo/db";
import { categories, menuImportJobs, optionGroups } from "@menuvo/db/schema";
import { asc, eq } from "drizzle-orm";
import { getFile } from "../../../infrastructure/storage/files-client.js";
import { logger } from "../../../lib/logger.js";
import { extractMenuFromText } from "./ai-extractor.js";
import { compareMenus } from "./comparer.js";
import { extractTextFromFile } from "./text-extractor.js";
import type { AllowedFileType, ExistingMenuData, ModelConfig } from "./types";

const menuImportLogger = logger.child({ service: "menu-import" });

/**
 * Default model for menu extraction.
 */
const DEFAULT_EXTRACTION_MODEL: ModelConfig = {
	id: "nvidia/nemotron-3-nano-30b-a3b:free",
	supportsStructuredOutput: false,
};

/**
 * Get existing menu data for a store.
 */
async function getExistingMenuData(storeId: string): Promise<ExistingMenuData> {
	const existingCategories = await db.query.categories.findMany({
		where: eq(categories.storeId, storeId),
		orderBy: [asc(categories.displayOrder)],
		with: {
			items: {
				orderBy: (items, { asc }) => [asc(items.displayOrder)],
			},
		},
	});

	const existingOptionGroups = await db.query.optionGroups.findMany({
		where: eq(optionGroups.storeId, storeId),
		orderBy: [asc(optionGroups.displayOrder)],
	});

	return {
		categories: existingCategories.map((cat) => ({
			id: cat.id,
			name:
				(cat.translations as Record<string, { name?: string }>)?.de?.name || "",
			description: (
				cat.translations as Record<string, { description?: string }>
			)?.de?.description,
			items: cat.items.map((item) => ({
				id: item.id,
				name:
					(item.translations as Record<string, { name?: string }>)?.de?.name ||
					"",
				description: (
					item.translations as Record<string, { description?: string }>
				)?.de?.description,
				price: item.price,
				allergens: item.allergens,
			})),
		})),
		optionGroups: existingOptionGroups.map((og) => ({
			id: og.id,
			name:
				(og.translations as Record<string, { name?: string }>)?.de?.name || "",
			description: (og.translations as Record<string, { description?: string }>)
				?.de?.description,
			type: og.type,
		})),
	};
}

/**
 * Create a new import job record.
 */
export async function createImportJob(params: {
	storeId: string;
	filename: string;
	fileType: AllowedFileType;
	fileKey: string;
}): Promise<{ jobId: string }> {
	const { storeId, filename, fileType, fileKey } = params;

	const [job] = await db
		.insert(menuImportJobs)
		.values({
			storeId,
			originalFilename: filename,
			fileType,
			fileKey,
		})
		.returning();

	if (!job) {
		throw new Error("Failed to create import job");
	}

	return { jobId: job.id };
}

/**
 * Process a menu import job.
 */
export async function processMenuImportJob(jobId: string): Promise<void> {
	const job = await db.query.menuImportJobs.findFirst({
		where: eq(menuImportJobs.id, jobId),
	});

	if (!job) {
		throw new Error(`Job ${jobId} not found`);
	}

	if (job.status !== "PROCESSING") {
		menuImportLogger.debug(
			{ jobId, status: job.status },
			"Job already processed",
		);
		return;
	}

	try {
		menuImportLogger.info({ jobId }, "Processing menu import job");

		// Step 1: Download file from internal bucket
		menuImportLogger.debug({ jobId, fileKey: job.fileKey }, "Downloading file");
		const fileBuffer = await getFile(job.fileKey);

		// Step 2: Extract text from file
		menuImportLogger.debug(
			{ jobId, fileType: job.fileType },
			"Extracting text from file",
		);
		const { text } = extractTextFromFile(
			fileBuffer,
			job.fileType as AllowedFileType,
		);
		menuImportLogger.debug({ jobId, charCount: text.length }, "Text extracted");

		// Step 3: Get existing menu for context
		menuImportLogger.debug(
			{ jobId, storeId: job.storeId },
			"Loading existing menu",
		);
		const existingMenu = await getExistingMenuData(job.storeId);
		menuImportLogger.debug(
			{
				jobId,
				categoryCount: existingMenu.categories.length,
				optionGroupCount: existingMenu.optionGroups.length,
			},
			"Existing menu loaded",
		);

		// Step 4: AI extraction
		menuImportLogger.debug({ jobId }, "Running AI extraction");
		const extractedMenu = await extractMenuFromText(text, {
			model: DEFAULT_EXTRACTION_MODEL,
			existingCategories: existingMenu.categories.map((c) => c.name),
			existingItems: existingMenu.categories.flatMap((c) =>
				c.items.map((i) => i.name),
			),
		});
		menuImportLogger.info(
			{
				jobId,
				categoryCount: extractedMenu.categories.length,
				itemCount: extractedMenu.categories.reduce(
					(sum, c) => sum + c.items.length,
					0,
				),
				optionGroupCount: extractedMenu.optionGroups.length,
				confidence: `${(extractedMenu.confidence * 100).toFixed(0)}%`,
			},
			"AI extraction complete",
		);

		// Step 5: Generate comparison
		menuImportLogger.debug({ jobId }, "Generating comparison");
		const comparisonData = compareMenus(extractedMenu, existingMenu);
		menuImportLogger.info(
			{
				jobId,
				newCategories: comparisonData.summary.newCategories,
				updatedCategories: comparisonData.summary.updatedCategories,
				newItems: comparisonData.summary.newItems,
				updatedItems: comparisonData.summary.updatedItems,
				newOptionGroups: comparisonData.summary.newOptionGroups,
				updatedOptionGroups: comparisonData.summary.updatedOptionGroups,
			},
			"Comparison generated",
		);

		// Step 6: Save comparison and mark as ready
		await db
			.update(menuImportJobs)
			.set({
				status: "READY",
				comparisonData,
			})
			.where(eq(menuImportJobs.id, jobId));

		menuImportLogger.info({ jobId }, "Job completed successfully");
	} catch (error) {
		menuImportLogger.error({ jobId, error }, "Job failed");

		await db
			.update(menuImportJobs)
			.set({
				status: "FAILED",
				errorMessage: error instanceof Error ? error.message : "Unknown error",
			})
			.where(eq(menuImportJobs.id, jobId));

		throw error;
	}
}
