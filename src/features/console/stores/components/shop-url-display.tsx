import { Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ShopUrlDisplayProps {
	slug: string;
}

export function ShopUrlDisplay({ slug }: ShopUrlDisplayProps) {
	const { t } = useTranslation("stores");
	const [copied, setCopied] = useState(false);

	const shopUrl = `https://www.menuvo.app/${slug}`;

	const handleCopy = async () => {
		await navigator.clipboard.writeText(shopUrl);
		setCopied(true);
		toast.success(t("toast.urlCopied"));
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="space-y-3 rounded-lg border p-4">
			<div className="space-y-0.5">
				<Label>{t("labels.shopUrl")}</Label>
				<p className="text-muted-foreground text-sm">
					{t("descriptions.shopUrl")}
				</p>
			</div>
			<div className="flex gap-2">
				<Input value={shopUrl} readOnly className="flex-1" />
				<Button
					variant="outline"
					size="icon"
					onClick={handleCopy}
					title={t("actions.copyUrl")}
				>
					{copied ? (
						<Check className="h-4 w-4 text-green-500" />
					) : (
						<Copy className="h-4 w-4" />
					)}
				</Button>
				<Button variant="outline" size="icon" asChild>
					<a
						href={shopUrl}
						target="_blank"
						rel="noopener noreferrer"
						title={t("actions.openShop")}
					>
						<ExternalLink className="h-4 w-4" />
					</a>
				</Button>
			</div>
		</div>
	);
}
