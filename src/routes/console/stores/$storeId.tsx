import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { PageActionBar } from "@/components/layout/page-action-bar";
import {
	ServicePointsPanel,
	servicePointQueries,
} from "@/features/console/service-points";
import { StoreClosuresForm } from "@/features/console/stores/components/store-closures-form";
import { StoreForm } from "@/features/console/stores/components/store-form";
import { StoreHoursForm } from "@/features/console/stores/components/store-hours-form";
import {
	storeClosuresQueries,
	storeHoursQueries,
	storeQueries,
} from "@/features/console/stores/queries";

const tabSchema = z.enum(["details", "hours", "closures", "qr-codes"]);
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
			context.queryClient.ensureQueryData(servicePointQueries.list(storeId)),
			context.queryClient.ensureQueryData(servicePointQueries.types(storeId)),
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

	const tabItems = [
		{ value: "details", label: t("tabs.details") },
		{ value: "hours", label: t("tabs.hours") },
		{ value: "closures", label: t("tabs.closures") },
		{ value: "qr-codes", label: t("tabs.qrCodes") },
	];

	return (
		<div className="space-y-6">
			<PageActionBar
				backHref="/console/stores"
				backLabel={store.name}
				tabs={{
					items: tabItems,
					value: tab,
					onChange: handleTabChange,
				}}
			/>

			<div className="mt-6">
				{tab === "details" && (
					<StoreForm store={store} merchantId={store.merchantId} />
				)}
				{tab === "hours" && <StoreHoursForm storeId={storeIdNum} />}
				{tab === "closures" && <StoreClosuresForm storeId={storeIdNum} />}
				{tab === "qr-codes" && (
					<Suspense
						fallback={<div className="py-8 text-center">Loading...</div>}
					>
						<ServicePointsPanel store={store} />
					</Suspense>
				)}
			</div>
		</div>
	);
}
