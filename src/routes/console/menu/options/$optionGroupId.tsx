import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { ConsoleError } from "@/features/console/components/console-error";
import { MenuBreadcrumb } from "@/features/console/menu/components/menu-breadcrumb";
import { OptionGroupForm } from "@/features/console/menu/components/option-group-form";
import { getDisplayName } from "@/features/console/menu/logic/display";
import { optionGroupQueries } from "@/features/console/menu/options.queries";

const searchSchema = z.object({
	storeId: z.string(),
});

export const Route = createFileRoute("/console/menu/options/$optionGroupId")({
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
			<MenuBreadcrumb
				storeId={storeId}
				currentPage={optionGroupName || t("emptyStates.unnamed")}
			/>

			<div>
				<h1 className="font-semibold text-2xl tracking-tight">
					{t("pageHeaders.editOptionGroupTitle")}
				</h1>
				<p className="text-muted-foreground">
					{t("pageHeaders.editOptionGroupDescription", { optionGroupName })}
				</p>
			</div>

			<OptionGroupForm storeId={storeId} optionGroup={optionGroup} />
		</div>
	);
}
