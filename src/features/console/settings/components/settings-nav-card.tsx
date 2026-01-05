import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SettingsNavCardProps {
	icon: LucideIcon;
	title: string;
	description: string;
	href: string;
	badge?: "coming-soon";
	disabled?: boolean;
}

export function SettingsNavCard({
	icon: Icon,
	title,
	description,
	href,
	badge,
	disabled,
}: SettingsNavCardProps) {
	const { t } = useTranslation("settings");
	const content = (
		<Card
			className={cn(
				"transition-colors duration-150",
				!disabled && "hover:bg-primary/5 cursor-pointer group",
				disabled && "opacity-70 cursor-not-allowed",
			)}
		>
			<CardHeader className="flex-row items-center gap-4">
				<div
					className={cn(
						"rounded-lg p-3",
						disabled ? "bg-muted" : "bg-primary/10",
					)}
				>
					<Icon
						className={cn(
							"h-5 w-5",
							disabled ? "text-muted-foreground" : "text-primary",
						)}
					/>
				</div>
				<div className="min-w-0 flex-1 space-y-1">
					<CardTitle className="flex items-center gap-2 text-base">
						{title}
						{badge === "coming-soon" && (
							<Badge variant="secondary" className="text-xs font-normal">
								{t("hub.comingSoon")}
							</Badge>
						)}
					</CardTitle>
					<CardDescription className="line-clamp-1">
						{description}
					</CardDescription>
				</div>
				{!disabled && (
					<ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
				)}
			</CardHeader>
		</Card>
	);

	if (disabled) {
		return content;
	}

	return (
		<Link to={href} className="block">
			{content}
		</Link>
	);
}
