import { Badge, LinkCard } from "@menuvo/ui";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SettingsNavCardProps {
	icon: LucideIcon;
	title: string;
	description: string;
	href: string;
	badge?: "coming-soon";
	disabled?: boolean;
}

export function SettingsNavCard({
	icon,
	title,
	description,
	href,
	badge,
	disabled,
}: SettingsNavCardProps) {
	const { t } = useTranslation("settings");

	return (
		<LinkCard
			href={href}
			icon={icon}
			title={title}
			description={description}
			disabled={disabled}
			showChevron
			badge={
				badge === "coming-soon" ? (
					<Badge variant="secondary" className="font-normal text-xs">
						{t("hub.comingSoon")}
					</Badge>
				) : undefined
			}
		/>
	);
}
