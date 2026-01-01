import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Calendar, Clock, Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StoreClosuresForm } from "@/features/settings/components/store-closures-form";
import { StoreHoursForm } from "@/features/settings/components/store-hours-form";
import { StoreForm } from "@/features/stores/components/store-form";
import {
	storeClosuresQueries,
	storeHoursQueries,
	storeQueries,
} from "@/features/stores/queries";

const tabSchema = z.enum(["details", "hours", "closures"]);
type TabValue = z.infer<typeof tabSchema>;

const searchSchema = z.object({
	tab: tabSchema.optional().default("details"),
});

export const Route = createFileRoute("/console/stores/$storeId")({
	validateSearch: searchSchema,
	loader: async ({ context, params }) => {
		const storeId = Number.parseInt(params.storeId, 10);
		await Promise.all([
			context.queryClient.ensureQueryData(storeQueries.detail(storeId)),
			context.queryClient.ensureQueryData(storeHoursQueries.list(storeId)),
			context.queryClient.ensureQueryData(storeClosuresQueries.list(storeId)),
		]);
	},
	component: EditStorePage,
});

function EditStorePage() {
	const { t } = useTranslation("stores");
	const navigate = useNavigate();
	const { storeId } = Route.useParams();
	const { tab = "details" } = Route.useSearch();
	const storeIdNum = Number.parseInt(storeId, 10);
	const { data: store } = useSuspenseQuery(storeQueries.detail(storeIdNum));

	const handleTabChange = (value: string) => {
		navigate({
			to: "/console/stores/$storeId",
			params: { storeId },
			search: { tab: value as TabValue },
		});
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title={t("titles.editStore")}
				description={t("descriptions.editingStore", { storeName: store.name })}
			/>

			<Tabs value={tab} onValueChange={handleTabChange}>
				<TabsList>
					<TabsTrigger value="details" className="gap-2">
						<Store className="h-4 w-4" />
						{t("tabs.details")}
					</TabsTrigger>
					<TabsTrigger value="hours" className="gap-2">
						<Clock className="h-4 w-4" />
						{t("tabs.hours")}
					</TabsTrigger>
					<TabsTrigger value="closures" className="gap-2">
						<Calendar className="h-4 w-4" />
						{t("tabs.closures")}
					</TabsTrigger>
				</TabsList>

				<div className="mt-6">
					<TabsContent value="details" className="mt-0">
						<StoreForm store={store} merchantId={store.merchantId} />
					</TabsContent>

					<TabsContent value="hours" className="mt-0">
						<StoreHoursForm storeId={storeIdNum} />
					</TabsContent>

					<TabsContent value="closures" className="mt-0">
						<StoreClosuresForm storeId={storeIdNum} />
					</TabsContent>
				</div>
			</Tabs>
		</div>
	);
}
