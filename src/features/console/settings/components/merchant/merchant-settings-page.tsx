import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Building2, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { merchantQueries } from "../../queries";
import { MerchantGeneralForm } from "./merchant-general-form";
import { MerchantLanguageForm } from "./merchant-language-form";

type TabValue = "general" | "language";

interface MerchantSettingsPageProps {
	search: { tab?: TabValue };
	merchantId: number;
}

export function MerchantSettingsPage({
	search,
	merchantId,
}: MerchantSettingsPageProps) {
	const { t } = useTranslation("settings");
	const navigate = useNavigate();
	const { data: merchant } = useSuspenseQuery(
		merchantQueries.detail(merchantId),
	);

	const tab = search.tab ?? "general";

	const handleTabChange = (value: string) => {
		navigate({
			to: "/console/settings/merchant",
			search: { tab: value as TabValue },
		});
	};

	return (
		<div className="space-y-6">
			<Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
				<Link to="/console/settings">
					<ArrowLeft className="mr-2 h-4 w-4" />
					{t("navigation.backToSettings")}
				</Link>
			</Button>

			<PageHeader
				title={t("pageTitle")}
				description={t("pageDescription", { merchantName: merchant.name })}
			/>

			<Tabs value={tab} onValueChange={handleTabChange}>
				<TabsList>
					<TabsTrigger value="general" className="gap-2">
						<Building2 className="h-4 w-4" />
						{t("tabs.general")}
					</TabsTrigger>
					<TabsTrigger value="language" className="gap-2">
						<Globe className="h-4 w-4" />
						{t("tabs.language")}
					</TabsTrigger>
				</TabsList>

				<div className="mt-6">
					<TabsContent value="general" className="mt-0">
						<MerchantGeneralForm merchantId={merchantId} />
					</TabsContent>

					<TabsContent value="language" className="mt-0">
						<MerchantLanguageForm merchantId={merchantId} />
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}
