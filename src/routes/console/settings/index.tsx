import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Building2, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MerchantGeneralForm } from "@/features/console/settings/components/merchant-general-form";
import { MerchantLanguageForm } from "@/features/console/settings/components/merchant-language-form";
import { merchantQueries } from "@/features/console/settings/queries";

const tabSchema = z.enum(["general", "language"]);
type TabValue = z.infer<typeof tabSchema>;

const searchSchema = z.object({
	tab: tabSchema.optional().default("general"),
});

// For now, hardcode merchantId=1 (in production, get from auth context)
const MERCHANT_ID = 1;

export const Route = createFileRoute("/console/settings/")({
	validateSearch: searchSchema,
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			merchantQueries.detail(MERCHANT_ID),
		);
	},
	component: MerchantSettingsPage,
});

function MerchantSettingsPage() {
	const { t } = useTranslation("settings");
	const navigate = useNavigate();
	const { tab = "general" } = Route.useSearch();
	const { data: merchant } = useSuspenseQuery(
		merchantQueries.detail(MERCHANT_ID),
	);

	const handleTabChange = (value: string) => {
		navigate({
			to: "/console/settings",
			search: { tab: value as TabValue },
		});
	};

	return (
		<div className="space-y-6">
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
						<MerchantGeneralForm merchantId={MERCHANT_ID} />
					</TabsContent>

					<TabsContent value="language" className="mt-0">
						<MerchantLanguageForm merchantId={MERCHANT_ID} />
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}
