import { AlertTriangle, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { TranslationStatus } from "../schemas";

interface TranslationStatusBadgeProps {
	status: TranslationStatus;
	languageCode?: string;
	showLabel?: boolean;
	size?: "sm" | "default";
}

export function TranslationStatusBadge({
	status,
	languageCode,
	showLabel = false,
	size = "default",
}: TranslationStatusBadgeProps) {
	const { t } = useTranslation("common");

	const config = {
		complete: {
			icon: Check,
			bgClass: "bg-green-500/20 text-green-600",
			dotClass: "bg-green-500",
		},
		partial: {
			icon: AlertTriangle,
			bgClass: "bg-yellow-500/20 text-yellow-600",
			dotClass: "bg-yellow-500",
		},
		missing: {
			icon: X,
			bgClass: "bg-red-500/15 text-red-600",
			dotClass: "bg-red-500",
		},
	};

	const { icon: Icon, bgClass, dotClass } = config[status];
	const label = t(`translationStatus.${status}`);

	// Compact badge for list items (size="sm")
	if (size === "sm") {
		return (
			<div
				className={cn(
					"inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase",
					bgClass,
				)}
				title={`${languageCode?.toUpperCase()}: ${label}`}
			>
				{languageCode && <span>{languageCode}</span>}
				<span className={cn("w-1.5 h-1.5 rounded-full", dotClass)} />
			</div>
		);
	}

	// Default badge with icon and optional label
	return (
		<div
			className={cn(
				"inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium",
				bgClass,
			)}
		>
			<Icon className="h-3.5 w-3.5" />
			{languageCode && (
				<span className="uppercase font-semibold">{languageCode}</span>
			)}
			{showLabel && <span>{label}</span>}
		</div>
	);
}
