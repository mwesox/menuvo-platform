import { Card, VStack } from "@chakra-ui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { ServicePointForm } from "@/features/service-points/components/service-point-form";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute(
	"/_app/stores/$storeId/service-points/$servicePointId",
)({
	component: EditServicePointPage,
	errorComponent: ConsoleError,
});

function EditServicePointPage() {
	return (
		<Suspense fallback={<EditServicePointSkeleton />}>
			<EditServicePointContent />
		</Suspense>
	);
}

function EditServicePointSkeleton() {
	return (
		<VStack gap="6" align="stretch">
			<Card.Root>
				<Card.Body py="8" textAlign="center" color="fg.muted">
					Loading...
				</Card.Body>
			</Card.Root>
		</VStack>
	);
}

function EditServicePointContent() {
	const store = useStore();
	const navigate = useNavigate();
	const { t } = useTranslation("servicePoints");
	const { servicePointId } = Route.useParams();
	const trpc = useTRPC();

	const { data: servicePoint } = useSuspenseQuery({
		...trpc.store.servicePoints.getById.queryOptions({ id: servicePointId }),
	});

	const handleSuccess = () => {
		navigate({
			to: "/stores/$storeId/service-points",
			params: { storeId: store.id },
		});
	};

	const handleCancel = () => {
		navigate({
			to: "/stores/$storeId/service-points",
			params: { storeId: store.id },
		});
	};

	return (
		<VStack gap="6" align="stretch">
			<PageActionBar
				breadcrumbs={[
					{
						label: t("titles.servicePoints"),
						href: `/stores/${store.id}/service-points`,
					},
					{ label: servicePoint.name },
				]}
			/>
			<Card.Root>
				<Card.Header>
					<Card.Title>{t("titles.editServicePoint")}</Card.Title>
					<Card.Description>
						{t("descriptions.editServicePoint")}
					</Card.Description>
				</Card.Header>
				<Card.Body>
					<ServicePointForm
						storeId={store.id}
						servicePoint={servicePoint}
						onSuccess={handleSuccess}
						onCancel={handleCancel}
					/>
				</Card.Body>
			</Card.Root>
			<Outlet />
		</VStack>
	);
}
