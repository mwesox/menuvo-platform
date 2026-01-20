import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { OptionGroupForm } from "@/features/menu/components/option-group-form";
import { getDisplayName } from "@/features/menu/logic/display";
import { trpcUtils } from "@/lib/trpc";

export const Route = createFileRoute(
	"/_app/stores/$storeId/menu/options/$optionGroupId",
)({
	loader: async ({ params }) => {
		const optionGroup = await trpcUtils.menu.options.getGroup.ensureData({
			optionGroupId: params.optionGroupId,
		});
		return optionGroup;
	},
	component: EditOptionGroupPage,
	errorComponent: ConsoleError,
});

function EditOptionGroupPage() {
	const store = useStore();
	const { t } = useTranslation("menu");
	const optionGroup = Route.useLoaderData();

	if (!optionGroup) {
		return null;
	}

	const language = "de";
	const optionGroupName = getDisplayName(optionGroup.translations, language);

	return (
		<div className="space-y-6">
			<PageActionBar
				breadcrumbs={[
					{
						label: t("titles.optionGroups"),
						href: `/stores/${store.id}/menu/options`,
					},
					{ label: optionGroupName || t("emptyStates.unnamed") },
				]}
			/>

			<OptionGroupForm storeId={store.id} optionGroup={optionGroup} />
		</div>
	);
}
