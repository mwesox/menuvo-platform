import imageCompression from "browser-image-compression";

const MAX_SIZE_MB = 2;
const MAX_DIMENSION = 1920;

export interface ResizedImage {
	blob: Blob;
	width: number;
	height: number;
}

/**
 * Resize an image on the client side before upload.
 * Returns a Blob (no base64 conversion - binary upload is more efficient).
 * Uses Web Workers for non-blocking processing.
 */
export async function resizeImage(file: File): Promise<ResizedImage> {
	const options = {
		maxSizeMB: MAX_SIZE_MB,
		maxWidthOrHeight: MAX_DIMENSION,
		useWebWorker: true,
		// Keep original format - WebP conversion happens server-side
	};

	const compressedBlob = await imageCompression(file, options);
	const dimensions = await getImageDimensions(compressedBlob);

	return {
		blob: compressedBlob,
		width: dimensions.width,
		height: dimensions.height,
	};
}

/**
 * Resize a cropped canvas blob before upload.
 */
export async function resizeCroppedImage(blob: Blob): Promise<ResizedImage> {
	const file = new File([blob], "cropped.jpg", { type: blob.type });
	return resizeImage(file);
}

/**
 * Get image dimensions from a blob.
 */
function getImageDimensions(
	blob: Blob,
): Promise<{ width: number; height: number }> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			resolve({ width: img.width, height: img.height });
			URL.revokeObjectURL(img.src);
		};
		img.onerror = reject;
		img.src = URL.createObjectURL(blob);
	});
}
