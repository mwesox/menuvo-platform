import { VStack } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { OptionGroupForm } from "@/features/menu/components/option-group-form";

export const Route = createFileRoute("/_app/stores/$storeId/menu/options/new")({
	component: NewOptionGroupPage,
	errorComponent: ConsoleError,
});

function NewOptionGroupPage() {
	const store = useStore();
	const { t } = useTranslation("menu");

	return (
		<VStack gap="6" align="stretch">
			<PageActionBar
				breadcrumbs={[
					{
						label: t("titles.optionGroups"),
						href: `/stores/${store.id}/menu/options`,
					},
					{ label: t("titles.addOptionGroup") },
				]}
			/>

			<OptionGroupForm storeId={store.id} />
		</VStack>
	);
}
