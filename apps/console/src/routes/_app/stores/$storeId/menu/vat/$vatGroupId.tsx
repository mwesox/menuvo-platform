import { Card, Skeleton, VStack } from "@chakra-ui/react";
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
		<VStack gap="6" align="stretch">
			<Skeleton h="6" w="12rem" />
			<Card.Root>
				<Card.Body>
					<VStack gap="4" align="stretch">
						{Array.from({ length: 4 }).map((_, i) => (
							<Skeleton key={i} h="12" rounded="md" />
						))}
					</VStack>
				</Card.Body>
			</Card.Root>
		</VStack>
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
		<VStack gap="6" align="stretch">
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
		</VStack>
	);
}
