import { Box, Heading, Skeleton, VStack } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ConsoleError } from "@/features/components/console-error";
import { MerchantGeneralForm } from "@/features/settings/components/merchant/merchant-general-form";

export const Route = createFileRoute("/_app/settings/")({
	component: BusinessSettingsPage,
	pendingComponent: SettingsContentSkeleton,
	errorComponent: ConsoleError,
});

function BusinessSettingsPage() {
	const { t } = useTranslation("settings");

	return (
		<VStack gap="8" align="stretch" w="full">
			<Heading as="h1" textStyle="pageTitle">
				{t("titles.business")}
			</Heading>
			<MerchantGeneralForm />
		</VStack>
	);
}

export function SettingsContentSkeleton() {
	return (
		<VStack gap="6" align="stretch">
			<VStack gap="3" align="stretch">
				<Skeleton h="6" w="48" />
				<Skeleton h="4" w="80" />
			</VStack>
			<Box rounded="lg" borderWidth="1px" p="4">
				<VStack gap="4" align="stretch">
					<Skeleton h="10" w="full" />
					<Box
						display={{ base: "block", sm: "grid" }}
						gridTemplateColumns={{ sm: "repeat(2, 1fr)" }}
						gap="4"
					>
						<Skeleton h="10" w="full" />
						<Skeleton h="10" w="full" />
					</Box>
				</VStack>
			</Box>
		</VStack>
	);
}
