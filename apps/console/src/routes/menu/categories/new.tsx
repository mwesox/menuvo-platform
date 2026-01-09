import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { ConsoleError } from "@/features/components/console-error";
import { CategoryForm } from "@/features/menu/components/category-form";

const searchSchema = z.object({
	storeId: z.string(),
});

export const Route = createFileRoute("/menu/categories/new")({
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
					{ label: t("titles.categories"), href: "/menu", search: { storeId } },
					{ label: t("titles.addCategory") },
				]}
			/>
			<CategoryForm storeId={storeId} />
		</div>
	);
}
