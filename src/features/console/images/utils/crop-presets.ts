import type { ImageType } from "@/db/schema";

export interface CropPreset {
	id: string;
	label: string;
	description: string;
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
	square: {
		id: "square",
		label: "Square",
		description: "Best for thumbnails",
		aspectRatio: 1,
		minWidth: 400,
		minHeight: 400,
	},
	hero: {
		id: "hero",
		label: "Hero 4:3",
		description: "Best for item detail",
		aspectRatio: 4 / 3,
		minWidth: 800,
		minHeight: 600,
	},
	banner: {
		id: "banner",
		label: "Banner 16:9",
		description: "Best for store cards",
		aspectRatio: 16 / 9,
		minWidth: 1200,
		minHeight: 675,
	},
	free: {
		id: "free",
		label: "Free",
		description: "No constraints",
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
			// Item images need both square (thumbnail) and hero (drawer)
			return [
				CROP_PRESETS.square,
				CROP_PRESETS.hero,
				CROP_PRESETS.free,
			];
		case "store_banner":
			// Store banners are 16:9
			return [
				CROP_PRESETS.banner,
				CROP_PRESETS.hero,
				CROP_PRESETS.free,
			];
		case "store_logo":
		case "merchant_logo":
			// Logos are typically square
			return [
				CROP_PRESETS.square,
				CROP_PRESETS.free,
			];
		default:
			return [
				CROP_PRESETS.square,
				CROP_PRESETS.hero,
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
