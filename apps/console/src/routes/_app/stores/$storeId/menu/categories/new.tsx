import { VStack } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { CategoryForm } from "@/features/menu/components/category-form";
import { trpcUtils } from "@/lib/trpc";

export const Route = createFileRoute(
	"/_app/stores/$storeId/menu/categories/new",
)({
	loader: async () => {
		// Prefetch VAT groups for the selector
		await trpcUtils.menu.vat.list.ensureData();
	},
	component: NewCategoryPage,
	errorComponent: ConsoleError,
});

function NewCategoryPage() {
	const store = useStore();
	const { t } = useTranslation("menu");

	return (
		<VStack gap="6" align="stretch">
			<PageActionBar
				breadcrumbs={[
					{
						label: t("titles.categories"),
						href: `/stores/${store.id}/menu`,
					},
					{ label: t("titles.addCategory") },
				]}
			/>
			<CategoryForm storeId={store.id} />
		</VStack>
	);
}
