import { Heading, VStack } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { StoreDetailContentSkeleton } from "@/features/stores/components/skeletons";
import { StoreHoursForm } from "@/features/stores/components/store-hours-form";

export const Route = createFileRoute("/_app/stores/$storeId/settings/hours")({
	component: StoreSettingsHoursPage,
	errorComponent: ConsoleError,
});

function StoreSettingsHoursPage() {
	const { t } = useTranslation("stores");
	const store = useStore();

	return (
		<Suspense fallback={<StoreDetailContentSkeleton />}>
			<VStack gap="8" align="stretch" w="full">
				<Heading as="h1" textStyle="pageTitle">
					{t("titles.openingHours")}
				</Heading>
				<StoreHoursForm storeId={store.id} />
			</VStack>
		</Suspense>
	);
}
