/**
 * Images Service
 *
 * Service facade for image operations.
 */

import type { Database } from "@menuvo/db";
import { images } from "@menuvo/db/schema";
import { and, eq } from "drizzle-orm";
import { uploadImage as uploadToStorage } from "../../infrastructure/images/upload.service.js";
import { DomainError } from "../errors.js";
import type { IImagesService } from "./interface.js";
import type {
	DeleteImageInput,
	DeleteImageResult,
	StorageService,
	UploadImageInput,
} from "./types.js";

/**
 * Images service implementation
 */
export class ImagesService implements IImagesService {
	private readonly db: Database;
	private readonly storage?: StorageService;

	constructor(db: Database, storage?: StorageService) {
		this.db = db;
		this.storage = storage;
	}

	async uploadImage(sessionMerchantId: string, input: UploadImageInput) {
		// Security: Verify merchantId matches session
		if (input.merchantId !== sessionMerchantId) {
			throw new DomainError(
				"FORBIDDEN",
				"Cannot create images for another merchant",
			);
		}

		// Delegate to infrastructure service
		const record = await uploadToStorage(input, this.db);

		return record;
	}

	async getImage(imageId: string) {
		const record = await this.db.query.images.findFirst({
			where: eq(images.id, imageId),
		});

		return record ?? null;
	}

	async deleteImage(input: DeleteImageInput): Promise<DeleteImageResult> {
		const { imageId, merchantId } = input;

		// Fetch record and verify ownership
		const record = await this.db.query.images.findFirst({
			where: and(eq(images.id, imageId), eq(images.merchantId, merchantId)),
		});

		if (!record) {
			throw new DomainError("NOT_FOUND", "Image not found or access denied");
		}

		// Delete S3 files if storage service is available
		let s3Result: DeleteImageResult["s3Result"] = null;

		if (this.storage) {
			try {
				s3Result = await this.storage.deleteImageVariants(record.key);
			} catch (error) {
				// Log the error but continue with DB deletion
				// Orphaned S3 files can be cleaned up later via lifecycle policies
				console.error("[images.deleteImage] S3 deletion failed:", error);
			}
		}

		// Delete database record
		await this.db.delete(images).where(eq(images.id, imageId));

		return {
			success: true,
			s3Result,
		};
	}
}
