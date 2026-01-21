import { Heading, VStack } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { StoreDetailContentSkeleton } from "@/features/stores/components/skeletons";
import { StoreOrderTypesForm } from "@/features/stores/components/store-order-types-form";

export const Route = createFileRoute(
	"/_app/stores/$storeId/settings/order-types",
)({
	component: StoreSettingsOrderTypesPage,
	errorComponent: ConsoleError,
});

function StoreSettingsOrderTypesPage() {
	const { t } = useTranslation("stores");
	const store = useStore();

	return (
		<Suspense fallback={<StoreDetailContentSkeleton />}>
			<VStack gap="8" align="stretch" w="full">
				<Heading as="h1" textStyle="pageTitle">
					{t("titles.orderTypes")}
				</Heading>
				<StoreOrderTypesForm storeId={store.id} />
			</VStack>
		</Suspense>
	);
}
