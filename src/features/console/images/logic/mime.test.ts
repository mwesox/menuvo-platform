import { describe, expect, it } from "vitest";
import { getExtensionFromMime, isValidImageMime } from "./mime";

describe("getExtensionFromMime", () => {
	it("should map JPEG types to jpg", () => {
		expect(getExtensionFromMime("image/jpeg")).toBe("jpg");
		expect(getExtensionFromMime("image/jpg")).toBe("jpg");
	});

	it("should map PNG to png", () => {
		expect(getExtensionFromMime("image/png")).toBe("png");
	});

	it("should map GIF to gif", () => {
		expect(getExtensionFromMime("image/gif")).toBe("gif");
	});

	it("should map WebP to webp", () => {
		expect(getExtensionFromMime("image/webp")).toBe("webp");
	});

	it("should map HEIC/HEIF types", () => {
		expect(getExtensionFromMime("image/heic")).toBe("heic");
		expect(getExtensionFromMime("image/heif")).toBe("heif");
	});

	it("should default to jpg for unknown types", () => {
		expect(getExtensionFromMime("image/unknown")).toBe("jpg");
		expect(getExtensionFromMime("application/octet-stream")).toBe("jpg");
		expect(getExtensionFromMime("")).toBe("jpg");
	});
});

describe("isValidImageMime", () => {
	it("should return true for supported MIME types", () => {
		expect(isValidImageMime("image/jpeg")).toBe(true);
		expect(isValidImageMime("image/jpg")).toBe(true);
		expect(isValidImageMime("image/png")).toBe(true);
		expect(isValidImageMime("image/gif")).toBe(true);
		expect(isValidImageMime("image/webp")).toBe(true);
		expect(isValidImageMime("image/heic")).toBe(true);
		expect(isValidImageMime("image/heif")).toBe(true);
	});

	it("should return false for unsupported MIME types", () => {
		expect(isValidImageMime("image/svg+xml")).toBe(false);
		expect(isValidImageMime("image/bmp")).toBe(false);
		expect(isValidImageMime("application/pdf")).toBe(false);
		expect(isValidImageMime("text/plain")).toBe(false);
		expect(isValidImageMime("")).toBe(false);
	});
});
