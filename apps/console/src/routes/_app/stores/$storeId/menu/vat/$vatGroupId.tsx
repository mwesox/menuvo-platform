import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { VatGroupForm } from "@/features/menu/components/vat-group-form";
import { trpcUtils, useTRPC } from "@/lib/trpc";

export const Route = createFileRoute(
	"/_app/stores/$storeId/menu/vat/$vatGroupId",
)({
	loader: async ({ params }) => {
		await trpcUtils.menu.vat.getById.ensureData({ id: params.vatGroupId });
	},
	component: EditVatGroupPage,
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

function EditVatGroupPage() {
	const { vatGroupId } = Route.useParams();
	const store = useStore();
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
						href: `/stores/${store.id}/menu/vat`,
					},
					{ label: vatGroup.name },
				]}
			/>
			<VatGroupForm storeId={store.id} vatGroup={vatGroup} />
		</div>
	);
}
