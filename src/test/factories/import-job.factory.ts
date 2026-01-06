/**
 * Factory for creating test menu import jobs.
 */

import type { MenuImportStatus } from "@/db/schema";
import { menuImportJobs } from "@/db/schema";
import { testDb } from "../db";
import { uniqueId } from "../utils/test-id";

export interface ImportJobFactoryOptions {
	testRunId: string;
	storeId: number;
	fileType?: "csv" | "xlsx" | "json" | "md" | "txt";
	status?: MenuImportStatus;
	originalFilename?: string;
}

export async function createTestImportJob(options: ImportJobFactoryOptions) {
	const {
		testRunId,
		storeId,
		fileType = "csv",
		status = "PROCESSING",
		originalFilename,
	} = options;

	const filename =
		originalFilename || `menu-${uniqueId(testRunId)}.${fileType}`;

	const [job] = await testDb
		.insert(menuImportJobs)
		.values({
			storeId,
			status,
			fileType,
			fileKey: `test/${testRunId}/${filename}`,
			originalFilename: filename,
		})
		.returning();

	return job;
}
