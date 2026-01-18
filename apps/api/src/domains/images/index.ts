/**
 * Images Domain
 *
 * Exports images service, router, and types.
 */

export type { IImagesService } from "./interface.js";
export { imageRouter } from "./router.js";
export type {
	CreateImageRecordInput,
	DeleteImageInput,
	GetImageInput,
	ImageType,
} from "./schemas.js";
export { imageType, imageTypeSchema } from "./schemas.js";
export { ImagesService } from "./service.js";
export type {
	DeleteImageResult,
	StorageService,
	UploadImageInput,
} from "./types.js";
