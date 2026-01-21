import { Card, VStack } from "@chakra-ui/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { ServicePointForm } from "@/features/service-points/components/service-point-form";

export const Route = createFileRoute(
	"/_app/stores/$storeId/service-points/new",
)({
	component: NewServicePointPage,
	errorComponent: ConsoleError,
});

function NewServicePointPage() {
	const store = useStore();
	const navigate = useNavigate();
	const { t } = useTranslation("servicePoints");

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
					{ label: t("titles.createServicePoint") },
				]}
			/>
			<Card.Root>
				<Card.Header>
					<Card.Title>{t("titles.createServicePoint")}</Card.Title>
					<Card.Description>
						{t("descriptions.createServicePoint")}
					</Card.Description>
				</Card.Header>
				<Card.Body>
					<ServicePointForm
						storeId={store.id}
						onSuccess={handleSuccess}
						onCancel={handleCancel}
					/>
				</Card.Body>
			</Card.Root>
		</VStack>
	);
}
