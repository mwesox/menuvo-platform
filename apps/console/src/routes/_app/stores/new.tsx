import { VStack } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { StoreDetailsForm } from "@/features/stores/components/store-details-form";

export const Route = createFileRoute("/_app/stores/new")({
	component: NewStorePage,
});

function NewStorePage() {
	const { t } = useTranslation("stores");
	const { merchantId } = Route.useRouteContext();

	// merchantId is guaranteed by _app beforeLoad - no null check needed
	return (
		<VStack gap="6" align="stretch">
			<PageActionBar backHref="/stores" backLabel={t("titles.createStore")} />
			<StoreDetailsForm merchantId={merchantId} />
		</VStack>
	);
}
