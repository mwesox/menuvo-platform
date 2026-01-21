import { Heading, VStack } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { ConsoleError } from "@/features/components/console-error";
import { AiRecommendationsForm } from "@/features/settings/components/ai-recommendations/ai-recommendations-form";
import { useTRPC } from "@/lib/trpc";
import { SettingsContentSkeleton } from "./index";

export const Route = createFileRoute("/_app/settings/ai")({
	component: AiSettingsPage,
	errorComponent: ConsoleError,
});

function AiSettingsPage() {
	const { t } = useTranslation("settings");
	const trpc = useTRPC();

	// Get the first store for AI recommendations (global setting)
	const { data: stores } = useQuery({
		...trpc.store.list.queryOptions(),
	});

	const firstStoreId = stores?.[0]?.id;

	if (!firstStoreId) {
		return null;
	}

	return (
		<Suspense fallback={<SettingsContentSkeleton />}>
			<VStack gap="8" align="stretch" w="full">
				<Heading as="h1" textStyle="pageTitle">
					{t("titles.upselling")}
				</Heading>
				<AiRecommendationsFormWrapper storeId={firstStoreId} />
			</VStack>
		</Suspense>
	);
}

function AiRecommendationsFormWrapper({ storeId }: { storeId: string }) {
	const trpc = useTRPC();

	// Ensure AI settings data is loaded
	useQuery({
		...trpc.store.recommendations.getAiSettings.queryOptions({ storeId }),
	});

	return <AiRecommendationsForm storeId={storeId} />;
}
