import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { ConsoleError } from "@/features/components/console-error";
import { MenuBreadcrumb } from "@/features/menu/components/menu-breadcrumb";
import { OptionGroupForm } from "@/features/menu/components/option-group-form";

const searchSchema = z.object({
	storeId: z.string(),
});

export const Route = createFileRoute("/menu/options/new")({
	validateSearch: searchSchema,
	component: RouteComponent,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	const { storeId } = Route.useSearch();
	const { t } = useTranslation("menu");

	return (
		<div className="space-y-6">
			<MenuBreadcrumb
				storeId={storeId}
				currentPage={t("titles.addOptionGroup")}
			/>

			<div>
				<h1 className="font-semibold text-2xl tracking-tight">
					{t("pageHeaders.addOptionGroupTitle")}
				</h1>
				<p className="text-muted-foreground">
					{t("pageHeaders.addOptionGroupDescription")}
				</p>
			</div>

			<OptionGroupForm storeId={storeId} />
		</div>
	);
}
