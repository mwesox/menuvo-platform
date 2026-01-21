import {
	Box,
	Button,
	Heading,
	HStack,
	Skeleton,
	Text,
	VStack,
} from "@chakra-ui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { CategoriesTable } from "@/features/menu/components/categories-table";
import { getCategoriesQueryOptions } from "@/features/menu/queries";
import {
	queryClient,
	trpc,
	trpcClient,
	useTRPC,
	useTRPCClient,
} from "@/lib/trpc";

export const Route = createFileRoute("/_app/stores/$storeId/menu/")({
	loader: async ({ params }) => {
		await queryClient.ensureQueryData(
			getCategoriesQueryOptions(trpc, trpcClient, params.storeId),
		);
	},
	component: CategoriesPage,
	pendingComponent: MenuPageSkeleton,
	errorComponent: ConsoleError,
});

function MenuPageSkeleton() {
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

function CategoriesPage() {
	const { t } = useTranslation("menu");
	const store = useStore();
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();

	const { data: categories } = useSuspenseQuery(
		getCategoriesQueryOptions(trpc, trpcClient, store.id),
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
						{t("titles.categories")}
					</Heading>
					<Text color="fg.muted">{t("pageHeaders.categoriesDescription")}</Text>
				</Box>
				<Button asChild>
					<Link
						to="/stores/$storeId/menu/categories/new"
						params={{ storeId: store.id }}
					>
						<Plus
							style={{ marginRight: "0.5rem", height: "1rem", width: "1rem" }}
						/>
						{t("titles.addCategory")}
					</Link>
				</Button>
			</HStack>

			<CategoriesTable
				categories={categories}
				storeId={store.id}
				language={language}
			/>
		</>
	);
}
