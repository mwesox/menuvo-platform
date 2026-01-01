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
				"transition-colors",
				!disabled && "hover:bg-muted/50 cursor-pointer",
				disabled && "opacity-60",
			)}
		>
			<CardHeader className="flex-row items-center gap-4">
				<div className="bg-primary/10 rounded-lg p-2.5">
					<Icon className="text-primary h-5 w-5" />
				</div>
				<div className="flex-1 space-y-1">
					<CardTitle className="flex items-center gap-2 text-base">
						{title}
						{badge === "coming-soon" && (
							<Badge variant="secondary" className="text-xs font-normal">
								{t("hub.comingSoon")}
							</Badge>
						)}
					</CardTitle>
					<CardDescription>{description}</CardDescription>
				</div>
				{!disabled && (
					<ChevronRight className="text-muted-foreground h-5 w-5" />
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
