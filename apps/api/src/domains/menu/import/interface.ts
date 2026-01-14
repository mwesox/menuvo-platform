/**
 * Menu Import Service Interface
 *
 * Defines the contract for menu import operations.
 */

import type {
	ApplyImportChangesInput,
	ApplyImportChangesResult,
	GetImportJobStatusInput,
	ImportJobStatus,
	UploadImportFileInput,
	UploadImportFileResult,
} from "./types.js";

/**
 * Menu import service interface
 */
export interface IMenuImportService {
	/**
	 * Upload a menu file and create an import job
	 */
	uploadFile(
		merchantId: string,
		input: UploadImportFileInput,
	): Promise<UploadImportFileResult>;

	/**
	 * Get import job status
	 */
	getJobStatus(
		merchantId: string,
		input: GetImportJobStatusInput,
	): Promise<ImportJobStatus>;

	/**
	 * Apply selected import changes
	 */
	applyChanges(
		merchantId: string,
		input: ApplyImportChangesInput,
	): Promise<ApplyImportChangesResult>;
}
