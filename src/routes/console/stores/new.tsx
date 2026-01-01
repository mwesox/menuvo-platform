import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/page-header";
import { StoreForm } from "@/features/console/stores/components/store-form";

export const Route = createFileRoute("/console/stores/new")({
	component: NewStorePage,
});

function NewStorePage() {
	const { t } = useTranslation("stores");
	// For MVP, we use merchantId 1. In production, this would come from auth context.
	const merchantId = 1;

	return (
		<div>
			<PageHeader
				title={t("titles.createStore")}
				description={t("descriptions.addNewStore")}
			/>
			<StoreForm merchantId={merchantId} />
		</div>
	);
}
