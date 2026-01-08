import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ConsoleError } from "@/features/components/console-error";
import { CategoryForm } from "@/features/menu/components/category-form";
import { MenuBreadcrumb } from "@/features/menu/components/menu-breadcrumb";

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

	return (
		<div className="space-y-6">
			<MenuBreadcrumb storeId={storeId} currentPage="New" />
			<CategoryForm storeId={storeId} />
		</div>
	);
}
