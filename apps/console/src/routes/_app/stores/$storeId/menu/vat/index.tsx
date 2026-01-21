import {
	Box,
	Button,
	Heading,
	HStack,
	Skeleton,
	Text,
	VStack,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { VatGroupsTable } from "@/features/menu/components/vat-groups-table";
import { trpcUtils, useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_app/stores/$storeId/menu/vat/")({
	loader: async () => {
		await trpcUtils.menu.vat.list.ensureData();
	},
	component: VatPage,
	pendingComponent: VatPageSkeleton,
	errorComponent: ConsoleError,
});

function VatPageSkeleton() {
	return (
		<VStack gap="6" align="stretch">
			<Skeleton h="6" w="48" />
			<VStack gap="2" align="stretch">
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton key={i} h="12" rounded="md" />
				))}
			</VStack>
		</VStack>
	);
}

function VatPage() {
	const { t } = useTranslation("menu");
	const store = useStore();
	const trpc = useTRPC();

	const { data: vatGroups = [] } = useQuery(trpc.menu.vat.list.queryOptions());

	return (
		<>
			<HStack justify="space-between" align="center">
				<Box>
					<Heading
						as="h1"
						fontWeight="semibold"
						textStyle="2xl"
						letterSpacing="tight"
					>
						{t("vat.titles.vatGroups")}
					</Heading>
					<Text color="fg.muted">
						{t("vat.pageHeaders.vatGroupsDescription")}
					</Text>
				</Box>
				<Button asChild>
					<Link
						to="/stores/$storeId/menu/vat/new"
						params={{ storeId: store.id }}
					>
						<Plus
							style={{ marginRight: "0.5rem", height: "1rem", width: "1rem" }}
						/>
						{t("vat.titles.addVatGroup")}
					</Link>
				</Button>
			</HStack>

			<VatGroupsTable vatGroups={vatGroups} storeId={store.id} />
		</>
	);
}
