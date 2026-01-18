import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { StoreForm } from "@/features/stores/components/store-form";

export const Route = createFileRoute("/_app/stores/new")({
	component: NewStorePage,
});

function NewStorePage() {
	const { t } = useTranslation("stores");
	const { merchantId } = Route.useRouteContext();

	// merchantId is guaranteed by _app beforeLoad - no null check needed
	return (
		<div className="space-y-6">
			<PageActionBar backHref="/stores" backLabel={t("titles.createStore")} />
			<StoreForm merchantId={merchantId} />
		</div>
	);
}
