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
import { OptionGroupsTable } from "@/features/menu/components/option-groups-table";
import { trpcUtils, useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_app/stores/$storeId/menu/options/")({
	loader: async ({ params }) => {
		await trpcUtils.menu.options.listGroups.ensureData({
			storeId: params.storeId,
		});
	},
	component: OptionsPage,
	pendingComponent: OptionsPageSkeleton,
	errorComponent: ConsoleError,
});

function OptionsPageSkeleton() {
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

function OptionsPage() {
	const { t } = useTranslation("menu");
	const store = useStore();
	const trpc = useTRPC();

	const { data: optionGroups = [] } = useQuery(
		trpc.menu.options.listGroups.queryOptions({ storeId: store.id }),
	);

	const language = "de";

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
						{t("titles.optionGroups")}
					</Heading>
					<Text color="fg.muted">
						{t("pageHeaders.optionGroupsDescription")}
					</Text>
				</Box>
				<Button asChild>
					<Link
						to="/stores/$storeId/menu/options/new"
						params={{ storeId: store.id }}
					>
						<Plus
							style={{ marginRight: "0.5rem", height: "1rem", width: "1rem" }}
						/>
						{t("titles.addOptionGroup")}
					</Link>
				</Button>
			</HStack>

			<OptionGroupsTable
				optionGroups={optionGroups}
				storeId={store.id}
				language={language}
			/>
		</>
	);
}
