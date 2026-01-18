import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { ConsoleError } from "@/features/components/console-error";
import { OptionGroupForm } from "@/features/menu/components/option-group-form";

const searchSchema = z.object({
	storeId: z.string(),
});

export const Route = createFileRoute("/_app/menu/options/new")({
	validateSearch: searchSchema,
	component: RouteComponent,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	const { storeId } = Route.useSearch();
	const { t } = useTranslation("menu");

	return (
		<div className="space-y-6">
			<PageActionBar
				breadcrumbs={[
					{
						label: t("titles.optionGroups"),
						href: "/menu/options",
						search: { storeId },
					},
					{ label: t("titles.addOptionGroup") },
				]}
			/>

			<OptionGroupForm storeId={storeId} />
		</div>
	);
}
