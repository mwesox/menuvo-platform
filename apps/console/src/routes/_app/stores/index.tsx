import {
	Box,
	Button,
	Heading,
	SimpleGrid,
	Text,
	VStack,
} from "@chakra-ui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { ConsoleError } from "@/features/components/console-error";
import { StoresPageSkeleton } from "@/features/stores/components/skeletons";
import { StoreCard } from "@/features/stores/components/store-card";
import { trpcUtils, useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_app/stores/")({
	loader: async () => {
		await trpcUtils.store.list.ensureData();
	},
	component: StoresPage,
	pendingComponent: StoresPageSkeleton,
	errorComponent: ConsoleError,
});

function StoresPage() {
	const { t } = useTranslation("stores");
	const trpc = useTRPC();
	const { data: stores } = useSuspenseQuery(trpc.store.list.queryOptions());

	return (
		<VStack gap="6" align="stretch">
			<PageActionBar
				title={t("titles.stores")}
				actions={
					<Button asChild>
						<Link to="/stores/new">
							<Plus
								style={{ marginRight: "0.5rem", height: "1rem", width: "1rem" }}
							/>
							{t("labels.addStore")}
						</Link>
					</Button>
				}
			/>

			{stores.length === 0 ? (
				<Box
					rounded="lg"
					borderWidth="1px"
					borderStyle="dashed"
					p="12"
					textAlign="center"
				>
					<Heading as="h3" fontWeight="semibold" textStyle="lg">
						{t("emptyStates.noStores")}
					</Heading>
					<Text mt="1" color="fg.muted" textStyle="sm">
						{t("emptyStates.noStoresDescription")}
					</Text>
				</Box>
			) : (
				<SimpleGrid columns={{ base: 1, lg: 2 }} gap="6">
					{stores.map((store) => (
						<StoreCard key={store.id} store={store} />
					))}
				</SimpleGrid>
			)}
		</VStack>
	);
}
