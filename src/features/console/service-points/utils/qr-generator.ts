import QRCode from "qrcode";

export interface QRCodeOptions {
	storeSlug: string;
	servicePointCode: string;
	size?: number;
}

/**
 * Build the menu URL for a service point.
 * The URL includes the service point code as a query parameter.
 */
export function buildMenuUrl(
	storeSlug: string,
	servicePointCode: string,
): string {
	// Use window.location.origin in browser, fallback to placeholder in SSR
	const baseUrl =
		typeof window !== "undefined"
			? window.location.origin
			: "https://menuvo.app";
	return `${baseUrl}/shop/${storeSlug}?sp=${servicePointCode}`;
}

/**
 * Generate a QR code as a data URL.
 * Returns a base64-encoded PNG image.
 */
export async function generateQRCodeDataUrl(
	options: QRCodeOptions,
): Promise<string> {
	const { storeSlug, servicePointCode, size = 256 } = options;
	const url = buildMenuUrl(storeSlug, servicePointCode);

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
 * Useful for scalable vector graphics.
 */
export async function generateQRCodeSVG(
	options: QRCodeOptions,
): Promise<string> {
	const { storeSlug, servicePointCode, size = 256 } = options;
	const url = buildMenuUrl(storeSlug, servicePointCode);

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
 * Copy the QR code URL to clipboard.
 */
export async function copyQRCodeUrl(
	storeSlug: string,
	servicePointCode: string,
): Promise<void> {
	const url = buildMenuUrl(storeSlug, servicePointCode);
	await navigator.clipboard.writeText(url);
}
