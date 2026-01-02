import { Check, Copy, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog.tsx";
import { Input } from "@/components/ui/input.tsx";
import type { ServicePoint } from "@/db/schema.ts";
import {
	buildMenuUrl,
	copyQRCodeUrl,
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
	const [copied, setCopied] = useState(false);

	const menuUrl = buildMenuUrl(storeSlug, servicePoint.code);

	useEffect(() => {
		if (open) {
			generateQRCodeDataUrl({
				storeSlug,
				servicePointCode: servicePoint.code,
				size: 300,
			}).then(setQrDataUrl);
		}
	}, [open, storeSlug, servicePoint.code]);

	const handleCopy = async () => {
		await copyQRCodeUrl(storeSlug, servicePoint.code);
		setCopied(true);
		toast.success(t("misc.urlCopied"));
		setTimeout(() => setCopied(false), 2000);
	};

	const handleDownload = async () => {
		await downloadQRCode({
			storeSlug,
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

					<div className="w-full space-y-3">
						<div className="flex gap-2">
							<Input value={menuUrl} readOnly className="flex-1 text-sm" />
							<Button
								variant="outline"
								size="icon"
								onClick={handleCopy}
								className="shrink-0"
							>
								{copied ? (
									<Check className="h-4 w-4 text-green-500" />
								) : (
									<Copy className="h-4 w-4" />
								)}
							</Button>
						</div>

						<Button onClick={handleDownload} className="w-full">
							<Download className="mr-2 h-4 w-4" />
							{t("labels.downloadQrCode")}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
