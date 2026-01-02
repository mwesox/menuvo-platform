import { Building2, CreditCard, Palette, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { SettingsNavCard } from "./settings-nav-card";

const settingsSections = [
	{
		id: "merchant",
		icon: Building2,
		titleKey: "hub.merchant.title",
		descriptionKey: "hub.merchant.description",
		href: "/console/settings/merchant",
	},
	{
		id: "staff",
		icon: Users,
		titleKey: "hub.staff.title",
		descriptionKey: "hub.staff.description",
		href: "/console/settings/staff",
		badge: "coming-soon" as const,
		disabled: true,
	},
	{
		id: "payments",
		icon: CreditCard,
		titleKey: "hub.payments.title",
		descriptionKey: "hub.payments.description",
		href: "/console/settings/payments",
	},
	{
		id: "brand",
		icon: Palette,
		titleKey: "hub.brand.title",
		descriptionKey: "hub.brand.description",
		href: "/console/settings/brand",
		badge: "coming-soon" as const,
		disabled: true,
	},
] as const;

export function SettingsHubPage() {
	const { t } = useTranslation("settings");

	return (
		<div className="space-y-6">
			<PageActionBar title={t("hub.pageTitle")} />

			<div className="grid gap-4 md:grid-cols-2">
				{settingsSections.map((section) => (
					<SettingsNavCard
						key={section.id}
						icon={section.icon}
						title={t(section.titleKey)}
						description={t(section.descriptionKey)}
						href={section.href}
						badge={"badge" in section ? section.badge : undefined}
						disabled={"disabled" in section ? section.disabled : undefined}
					/>
				))}
			</div>
		</div>
	);
}
