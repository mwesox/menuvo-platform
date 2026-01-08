import type { ImageType } from "@menuvo/db/schema";

export interface CropPreset {
	id: string;
	/** Translation key for the preset label */
	labelKey: string;
	/** Translation key for the preset description */
	descriptionKey: string;
	aspectRatio: number;
	/** Recommended minimum dimensions for quality */
	minWidth: number;
	minHeight: number;
}

/**
 * Crop presets optimized for shop display dimensions.
 *
 * Shop usage reference:
 * - Menu item thumbnail: 96×96px (1:1)
 * - Cart item thumbnail: 56×56px (1:1)
 * - Item drawer hero: full-width × 192-224px (~4:3)
 * - Store card banner: 16:9 aspect
 */
export const CROP_PRESETS: Record<string, CropPreset> = {
	thumbnail: {
		id: "thumbnail",
		labelKey: "thumbnail",
		descriptionKey: "thumbnailDescription",
		aspectRatio: 1,
		minWidth: 400,
		minHeight: 400,
	},
	detail: {
		id: "detail",
		labelKey: "detail",
		descriptionKey: "detailDescription",
		aspectRatio: 4 / 3,
		minWidth: 800,
		minHeight: 600,
	},
	banner: {
		id: "banner",
		labelKey: "banner",
		descriptionKey: "bannerDescription",
		aspectRatio: 16 / 9,
		minWidth: 1200,
		minHeight: 675,
	},
	free: {
		id: "free",
		labelKey: "free",
		descriptionKey: "freeDescription",
		aspectRatio: 0, // 0 = free aspect
		minWidth: 0,
		minHeight: 0,
	},
};

/**
 * Get available presets for a given image type.
 * Returns presets in order of relevance (recommended first).
 */
export function getPresetsForImageType(imageType: ImageType): CropPreset[] {
	switch (imageType) {
		case "item_image":
			// Item images: thumbnail for lists, detail for drawer view
			return [CROP_PRESETS.thumbnail, CROP_PRESETS.detail, CROP_PRESETS.free];
		case "store_logo":
		case "merchant_logo":
			// Logos are square for consistent display
			return [CROP_PRESETS.thumbnail, CROP_PRESETS.free];
		default:
			return [
				CROP_PRESETS.thumbnail,
				CROP_PRESETS.detail,
				CROP_PRESETS.banner,
				CROP_PRESETS.free,
			];
	}
}

/**
 * Get the default/recommended preset for an image type.
 */
export function getDefaultPreset(imageType: ImageType): CropPreset {
	const presets = getPresetsForImageType(imageType);
	return presets[0];
}

/**
 * Get the Tailwind aspect ratio class for an image type.
 * Used to ensure preview matches the crop aspect ratio.
 */
export function getAspectRatioClassForImageType(imageType: ImageType): string {
	switch (imageType) {
		case "store_logo":
		case "merchant_logo":
			return "aspect-square"; // 1:1
		case "item_image":
			return "aspect-[4/3]"; // 4:3 for drawer view
		default:
			return "aspect-[4/3]";
	}
}
