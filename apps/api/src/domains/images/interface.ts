/**
 * Images Service Interface
 *
 * Defines the contract for image operations.
 */

import type { images } from "@menuvo/db/schema";
import type {
	CreateImageRecordInput,
	DeleteImageInput,
	DeleteImageResult,
	UploadImageInput,
} from "./types.js";

/**
 * Images service interface
 */
export interface IImagesService {
	uploadImage(
		sessionMerchantId: string,
		input: UploadImageInput,
	): Promise<typeof images.$inferSelect>;

	getImage(imageId: string): Promise<typeof images.$inferSelect | null>;

	deleteImage(input: DeleteImageInput): Promise<DeleteImageResult>;

	createRecord(
		input: CreateImageRecordInput,
		merchantId: string,
	): Promise<typeof images.$inferSelect>;
}
