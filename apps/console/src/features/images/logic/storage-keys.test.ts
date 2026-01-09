import { describe, expect, it } from "vitest";
import { generateStorageKeys } from "./storage-keys";

describe("generateStorageKeys", () => {
	it("should generate correct key structure with provided UUID", () => {
		const keys = generateStorageKeys(
			"merchant-123",
			"item_image",
			"jpg",
			"test-uuid-456",
		);

		expect(keys.original).toBe(
			"merchant-123/item_image/test-uuid-456_original.jpg",
		);
		expect(keys.webp).toBe("merchant-123/item_image/test-uuid-456.webp");
		expect(keys.thumbnail).toBe(
			"merchant-123/item_image/test-uuid-456_thumb.webp",
		);
	});

	it("should generate UUID when not provided", () => {
		const keys = generateStorageKeys("merchant-123", "store_logo", "png");

		// Should match the pattern with a UUID
		expect(keys.webp).toMatch(/^merchant-123\/store_logo\/[a-f0-9-]+\.webp$/);
		expect(keys.original).toMatch(
			/^merchant-123\/store_logo\/[a-f0-9-]+_original\.png$/,
		);
		expect(keys.thumbnail).toMatch(
			/^merchant-123\/store_logo\/[a-f0-9-]+_thumb\.webp$/,
		);
	});

	it("should handle different image types", () => {
		const itemKeys = generateStorageKeys("m1", "item_image", "jpg", "uuid1");
		const logoKeys = generateStorageKeys("m1", "store_logo", "png", "uuid2");
		const bannerKeys = generateStorageKeys(
			"m1",
			"store_banner",
			"webp",
			"uuid3",
		);

		expect(itemKeys.webp).toBe("m1/item_image/uuid1.webp");
		expect(logoKeys.webp).toBe("m1/store_logo/uuid2.webp");
		expect(bannerKeys.webp).toBe("m1/store_banner/uuid3.webp");
	});

	it("should preserve original file extension", () => {
		const jpgKeys = generateStorageKeys("m1", "item_image", "jpg", "uuid");
		const pngKeys = generateStorageKeys("m1", "item_image", "png", "uuid");
		const heicKeys = generateStorageKeys("m1", "item_image", "heic", "uuid");

		expect(jpgKeys.original).toBe("m1/item_image/uuid_original.jpg");
		expect(pngKeys.original).toBe("m1/item_image/uuid_original.png");
		expect(heicKeys.original).toBe("m1/item_image/uuid_original.heic");
	});
});
