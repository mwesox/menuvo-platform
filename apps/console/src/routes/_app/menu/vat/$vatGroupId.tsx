import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod/v4";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { ConsoleError } from "@/features/components/console-error";
import { VatGroupForm } from "@/features/menu/components/vat-group-form";
import { trpcUtils, useTRPC } from "@/lib/trpc";

const searchSchema = z.object({
	storeId: z.string(),
});

export const Route = createFileRoute("/_app/menu/vat/$vatGroupId")({
	validateSearch: searchSchema,
	loader: async ({ params }) => {
		await trpcUtils.menu.vat.getById.ensureData({ id: params.vatGroupId });
	},
	component: RouteComponent,
	pendingComponent: VatGroupEditSkeleton,
	errorComponent: ConsoleError,
});

function VatGroupEditSkeleton() {
	return (
		<div className="space-y-6">
			<div className="h-6 w-48 animate-pulse rounded bg-muted" />
			<div className="space-y-4 rounded-lg border p-6">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="h-12 animate-pulse rounded bg-muted" />
				))}
			</div>
		</div>
	);
}

function RouteComponent() {
	const { vatGroupId } = Route.useParams();
	const { storeId } = Route.useSearch();
	const { t } = useTranslation("menu");
	const trpc = useTRPC();

	const { data: vatGroup } = useSuspenseQuery(
		trpc.menu.vat.getById.queryOptions({ id: vatGroupId }),
	);

	return (
		<div className="space-y-6">
			<PageActionBar
				breadcrumbs={[
					{
						label: t("vat.titles.vatGroups"),
						href: "/menu/vat",
						search: { storeId },
					},
					{ label: vatGroup.name },
				]}
			/>
			<VatGroupForm storeId={storeId} vatGroup={vatGroup} />
		</div>
	);
}
