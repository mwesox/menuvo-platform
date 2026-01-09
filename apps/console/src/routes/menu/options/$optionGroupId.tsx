import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { ConsoleError } from "@/features/components/console-error";
import { OptionGroupForm } from "@/features/menu/components/option-group-form";
import { getDisplayName } from "@/features/menu/logic/display";
import { optionGroupQueries } from "@/features/menu/options.queries";

const searchSchema = z.object({
	storeId: z.string(),
});

export const Route = createFileRoute("/menu/options/$optionGroupId")({
	validateSearch: searchSchema,
	loader: async ({ context, params }) => {
		await context.queryClient.ensureQueryData(
			optionGroupQueries.detail(params.optionGroupId),
		);
	},
	component: RouteComponent,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	const { storeId } = Route.useSearch();
	const { optionGroupId } = Route.useParams();
	const { t } = useTranslation("menu");

	const { data: optionGroup } = useSuspenseQuery(
		optionGroupQueries.detail(optionGroupId),
	);

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
