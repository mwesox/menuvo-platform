import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { merchantQueries } from "../../queries";
import { MerchantGeneralForm } from "./merchant-general-form";
import { MerchantLanguageForm } from "./merchant-language-form";

type TabValue = "general" | "language";

interface MerchantSettingsPageProps {
	search: { tab?: TabValue };
}

export function MerchantSettingsPage({ search }: MerchantSettingsPageProps) {
	const { t } = useTranslation("settings");
	const navigate = useNavigate();
	// Pre-fetch merchant data for the forms
	useSuspenseQuery(merchantQueries.detail());

	const tab = search.tab ?? "general";

	const handleTabChange = (value: string) => {
		navigate({
			to: "/settings/merchant",
			search: { tab: value as TabValue },
		});
	};

	const tabItems = [
		{ value: "general", label: t("tabs.general") },
		{ value: "language", label: t("tabs.language") },
	];

	return (
		<div className="space-y-6">
			<PageActionBar
				breadcrumbs={[
					{ label: t("hub.pageTitle"), href: "/settings" },
					{ label: t("hub.merchant.title") },
				]}
				tabs={{
					items: tabItems,
					value: tab,
					onChange: handleTabChange,
				}}
			/>

			<div className="mt-6">
				{tab === "general" && <MerchantGeneralForm />}
				{tab === "language" && <MerchantLanguageForm />}
			</div>
		</div>
	);
}
