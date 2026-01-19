import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { ConsoleError } from "@/features/components/console-error";
import { VatGroupForm } from "@/features/menu/components/vat-group-form";

const searchSchema = z.object({
	storeId: z.string(),
});

export const Route = createFileRoute("/_app/menu/vat/new")({
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
						label: t("vat.titles.vatGroups"),
						href: "/menu/vat",
						search: { storeId },
					},
					{ label: t("vat.titles.addVatGroup") },
				]}
			/>
			<VatGroupForm storeId={storeId} />
		</div>
	);
}
