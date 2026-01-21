import { Heading, VStack } from "@chakra-ui/react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ConsoleError } from "@/features/components/console-error";
import { MerchantLanguageForm } from "@/features/settings/components/merchant/merchant-language-form";

export const Route = createFileRoute("/_app/settings/language")({
	component: LanguageSettingsPage,
	errorComponent: ConsoleError,
});

function LanguageSettingsPage() {
	const { t } = useTranslation("settings");

	return (
		<VStack gap="8" align="stretch" w="full">
			<Heading as="h1" textStyle="pageTitle">
				{t("titles.language")}
			</Heading>
			<MerchantLanguageForm />
		</VStack>
	);
}
