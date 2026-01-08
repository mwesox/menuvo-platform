import QRCode from "qrcode";

export interface QRCodeOptions {
	shortCode: string;
	servicePointCode: string; // Used for filename
	size?: number;
}

/**
 * Build the short URL for QR codes.
 * This URL never changes - protects printed QR codes from breaking.
 */
export function buildShortUrl(shortCode: string): string {
	return `https://www.menuvo.app/q/${shortCode}`;
}

/**
 * Build the full menu URL for sharing (human-readable).
 * Use this for copy-to-clipboard, not for QR codes.
 */
export function buildFullUrl(
	storeSlug: string,
	servicePointCode: string,
): string {
	return `https://www.menuvo.app/shop/${storeSlug}?sp=${servicePointCode}`;
}

/**
 * @deprecated Use buildFullUrl instead
 */
export function buildMenuUrl(
	storeSlug: string,
	servicePointCode: string,
): string {
	return buildFullUrl(storeSlug, servicePointCode);
}

/**
 * Generate a QR code as a data URL.
 * Uses short URL for permanence.
 */
export async function generateQRCodeDataUrl(
	options: QRCodeOptions,
): Promise<string> {
	const { shortCode, size = 256 } = options;
	const url = buildShortUrl(shortCode);

	return QRCode.toDataURL(url, {
		width: size,
		margin: 2,
		color: {
			dark: "#000000",
			light: "#ffffff",
		},
		errorCorrectionLevel: "M",
	});
}

/**
 * Generate a QR code as SVG string.
 * Uses short URL for permanence.
 */
export async function generateQRCodeSVG(
	options: QRCodeOptions,
): Promise<string> {
	const { shortCode, size = 256 } = options;
	const url = buildShortUrl(shortCode);

	return QRCode.toString(url, {
		type: "svg",
		width: size,
		margin: 2,
		color: {
			dark: "#000000",
			light: "#ffffff",
		},
		errorCorrectionLevel: "M",
	});
}

/**
 * Trigger download of a QR code as PNG.
 * Must be called from a browser context.
 */
export async function downloadQRCode(
	options: QRCodeOptions & { filename?: string },
): Promise<void> {
	const { filename, ...qrOptions } = options;
	const dataUrl = await generateQRCodeDataUrl({ ...qrOptions, size: 512 });

	const link = document.createElement("a");
	link.href = dataUrl;
	link.download = filename ?? `qr-${qrOptions.servicePointCode}.png`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

/**
 * Copy the short URL to clipboard.
 */
export async function copyShortUrl(shortCode: string): Promise<void> {
	const url = buildShortUrl(shortCode);
	await navigator.clipboard.writeText(url);
}

/**
 * Copy the full menu URL to clipboard.
 */
export async function copyFullUrl(
	storeSlug: string,
	servicePointCode: string,
): Promise<void> {
	const url = buildFullUrl(storeSlug, servicePointCode);
	await navigator.clipboard.writeText(url);
}

/**
 * @deprecated Use copyFullUrl instead
 */
export async function copyQRCodeUrl(
	storeSlug: string,
	servicePointCode: string,
): Promise<void> {
	return copyFullUrl(storeSlug, servicePointCode);
}
