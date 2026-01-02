import { eq } from "drizzle-orm";
import { db } from "@/db";
import { menuImportJobs } from "@/db/schema";
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
		console.log(`Job ${jobId} already processed (status: ${job.status})`);
		return;
	}

	try {
		console.log(`Processing menu import job ${jobId}...`);

		// Step 1: Download file from internal bucket
		console.log(`  Downloading file: ${job.fileKey}`);
		const fileBuffer = await getFile(job.fileKey);

		// Step 2: Extract text from file
		console.log(`  Extracting text from ${job.fileType} file...`);
		const { text } = extractTextFromFile(
			fileBuffer,
			job.fileType as AllowedFileType,
		);
		console.log(`  Extracted ${text.length} characters`);

		// Step 3: Get existing menu for context
		console.log(`  Loading existing menu for store ${job.storeId}...`);
		const existingMenu = await getExistingMenuData(job.storeId);
		console.log(
			`  Found ${existingMenu.categories.length} categories, ${existingMenu.optionGroups.length} option groups`,
		);

		// Step 4: AI extraction
		console.log(`  Running AI extraction...`);
		const extractedMenu = await extractMenuFromText(text, {
			model: DEFAULT_EXTRACTION_MODEL,
			existingCategories: existingMenu.categories.map((c) => c.name),
			existingItems: existingMenu.categories.flatMap((c) =>
				c.items.map((i) => i.name),
			),
		});
		console.log(
			`  Extracted ${extractedMenu.categories.length} categories with ${extractedMenu.categories.reduce((sum, c) => sum + c.items.length, 0)} items`,
		);
		console.log(
			`  Extracted ${extractedMenu.optionGroups.length} option groups`,
		);
		console.log(
			`  Confidence: ${(extractedMenu.confidence * 100).toFixed(0)}%`,
		);

		// Step 5: Generate comparison
		console.log(`  Generating comparison...`);
		const comparisonData = compareMenus(extractedMenu, existingMenu);
		console.log(`  Summary:`);
		console.log(
			`    Categories: ${comparisonData.summary.newCategories} new, ${comparisonData.summary.updatedCategories} updated`,
		);
		console.log(
			`    Items: ${comparisonData.summary.newItems} new, ${comparisonData.summary.updatedItems} updated`,
		);
		console.log(
			`    Option Groups: ${comparisonData.summary.newOptionGroups} new, ${comparisonData.summary.updatedOptionGroups} updated`,
		);

		// Step 6: Save comparison and mark as ready
		await db
			.update(menuImportJobs)
			.set({
				status: "READY",
				comparisonData,
			})
			.where(eq(menuImportJobs.id, jobId));

		console.log(`Job ${jobId} completed successfully`);
	} catch (error) {
		console.error(`Job ${jobId} failed:`, error);

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
