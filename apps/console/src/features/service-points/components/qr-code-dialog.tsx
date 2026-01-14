import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
} from "@menuvo/ui";
import { Check, Copy, Download, Link } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { ServicePoint } from "../types.ts";
import {
	buildFullUrl,
	buildShortUrl,
	copyFullUrl,
	copyShortUrl,
	downloadQRCode,
	generateQRCodeDataUrl,
} from "../utils/qr-generator.ts";

interface QRCodeDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	servicePoint: ServicePoint;
	storeSlug: string;
}

export function QRCodeDialog({
	open,
	onOpenChange,
	servicePoint,
	storeSlug,
}: QRCodeDialogProps) {
	const { t } = useTranslation("servicePoints");
	const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
	const [copiedShort, setCopiedShort] = useState(false);
	const [copiedFull, setCopiedFull] = useState(false);

	const shortUrl = buildShortUrl(servicePoint.shortCode);
	const fullUrl = buildFullUrl(storeSlug, servicePoint.code);

	useEffect(() => {
		if (open) {
			generateQRCodeDataUrl({
				shortCode: servicePoint.shortCode,
				servicePointCode: servicePoint.code,
				size: 300,
			}).then(setQrDataUrl);
		}
	}, [open, servicePoint.shortCode, servicePoint.code]);

	const handleCopyShort = async () => {
		await copyShortUrl(servicePoint.shortCode);
		setCopiedShort(true);
		toast.success(t("misc.urlCopied"));
		setTimeout(() => setCopiedShort(false), 2000);
	};

	const handleCopyFull = async () => {
		await copyFullUrl(storeSlug, servicePoint.code);
		setCopiedFull(true);
		toast.success(t("misc.urlCopied"));
		setTimeout(() => setCopiedFull(false), 2000);
	};

	const handleDownload = async () => {
		await downloadQRCode({
			shortCode: servicePoint.shortCode,
			servicePointCode: servicePoint.code,
			filename: `qr-${servicePoint.code}.png`,
		});
		toast.success(t("misc.qrCodeDownloaded"));
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{servicePoint.name}</DialogTitle>
					<DialogDescription>
						{t("descriptions.qrCodeDescription")}
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col items-center gap-6 py-4">
					{qrDataUrl ? (
						<div className="rounded-lg border bg-white p-4">
							<img
								src={qrDataUrl}
								alt={`QR code for ${servicePoint.name}`}
								className="h-[250px] w-[250px]"
							/>
						</div>
					) : (
						<div className="flex h-[282px] w-[282px] items-center justify-center rounded-lg border bg-muted">
							<span className="text-muted-foreground">{t("misc.loading")}</span>
						</div>
					)}

					<div className="w-full space-y-4">
						{/* Short URL - for QR code / printing */}
						<div className="space-y-1.5">
							<Label className="text-muted-foreground text-xs">
								{t("labels.qrCodeUrl", "QR Code URL (for printing)")}
							</Label>
							<div className="flex gap-2">
								<Input
									value={shortUrl}
									readOnly
									className="flex-1 font-mono text-sm"
								/>
								<Button
									variant="outline"
									size="icon"
									onClick={handleCopyShort}
									className="shrink-0"
								>
									{copiedShort ? (
										<Check className="size-4 text-green-500" />
									) : (
										<Copy className="size-4" />
									)}
								</Button>
							</div>
						</div>

						{/* Full URL - for sharing */}
						<div className="space-y-1.5">
							<Label className="text-muted-foreground text-xs">
								{t("labels.shareUrl", "Share URL (human-readable)")}
							</Label>
							<div className="flex gap-2">
								<Input value={fullUrl} readOnly className="flex-1 text-sm" />
								<Button
									variant="outline"
									size="icon"
									onClick={handleCopyFull}
									className="shrink-0"
								>
									{copiedFull ? (
										<Check className="size-4 text-green-500" />
									) : (
										<Link className="size-4" />
									)}
								</Button>
							</div>
						</div>

						<Button onClick={handleDownload} className="w-full">
							<Download className="me-2 size-4" />
							{t("labels.downloadQrCode")}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
