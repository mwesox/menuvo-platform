import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { ConsoleError } from "@/features/components/console-error";
import { OptionGroupForm } from "@/features/menu/components/option-group-form";
import { getDisplayName } from "@/features/menu/logic/display";
import { trpcUtils } from "@/lib/trpc";

const searchSchema = z.object({
	storeId: z.string(),
});

export const Route = createFileRoute("/_app/menu/options/$optionGroupId")({
	validateSearch: searchSchema,
	loader: async ({ params }) => {
		const optionGroup = await trpcUtils.menu.options.getGroup.ensureData({
			optionGroupId: params.optionGroupId,
		});
		return optionGroup;
	},
	component: RouteComponent,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	const { storeId } = Route.useSearch();
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
						href: "/menu/options",
						search: { storeId },
					},
					{ label: optionGroupName || t("emptyStates.unnamed") },
				]}
			/>

			<OptionGroupForm storeId={storeId} optionGroup={optionGroup} />
		</div>
	);
}
