import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { VatGroupForm } from "@/features/menu/components/vat-group-form";

export const Route = createFileRoute("/_app/stores/$storeId/menu/vat/new")({
	component: NewVatGroupPage,
	errorComponent: ConsoleError,
});

function NewVatGroupPage() {
	const store = useStore();
	const { t } = useTranslation("menu");

	return (
		<div className="space-y-6">
			<PageActionBar
				breadcrumbs={[
					{
						label: t("vat.titles.vatGroups"),
						href: `/stores/${store.id}/menu/vat`,
					},
					{ label: t("vat.titles.addVatGroup") },
				]}
			/>
			<VatGroupForm storeId={store.id} />
		</div>
	);
}
