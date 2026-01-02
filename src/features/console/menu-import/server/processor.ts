import { eq } from "drizzle-orm";
import { db } from "@/db";
import { menuImportJobs } from "@/db/schema";
import { menuImportLogger } from "@/lib/logger";
import { getFile } from "@/lib/storage/files-client";
import { extractMenuFromText, type ModelConfig } from "../logic/ai-extractor";
import { compareMenus } from "../logic/comparer";
import { extractTextFromFile } from "../logic/text-extractor";
import type { AllowedFileType } from "../validation";
import { getExistingMenuData } from "./import.helpers";

/**
 * Default model for menu extraction.
 * Configure based on your needs and budget.
 */
const DEFAULT_EXTRACTION_MODEL: ModelConfig = {
	id: "nvidia/nemotron-3-nano-30b-a3b:free",
	supportsStructuredOutput: false,
};

/**
 * Process a single menu import job.
 * Called by the worker after pulling from the queue.
 */
export async function processMenuImportJob(jobId: number): Promise<void> {
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

		// Mark as failed
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
