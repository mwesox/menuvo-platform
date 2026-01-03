import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { StoreForm } from "@/features/console/stores/components/store-form";

export const Route = createFileRoute("/console/stores/new")({
	component: NewStorePage,
});

function NewStorePage() {
	const { t } = useTranslation("stores");
	const { merchantId } = Route.useRouteContext();

	// merchantId is guaranteed by parent route redirect
	if (!merchantId) return null;

	return (
		<div className="space-y-6">
			<PageActionBar
				backHref="/console/stores"
				backLabel={t("titles.createStore")}
			/>
			<StoreForm merchantId={merchantId} />
		</div>
	);
}
