import { Box, Card, HStack } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useCookieConsentOptional } from "../contexts/cookie-consent-context";
import { ShopButton, ShopHeading, ShopMutedText } from "./ui";

export function CookieBanner() {
	const { t } = useTranslation("legal");
	const cookieConsent = useCookieConsentOptional();

	if (!cookieConsent) {
		return null;
	}

	const { showBanner, acceptAll, rejectNonEssential } = cookieConsent;

	if (!showBanner) {
		return null;
	}

	return (
		<Box
			position="fixed"
			bottom="4"
			left="50%"
			transform="translateX(-50%)"
			zIndex="50"
			w="calc(100% - 2rem)"
			maxW="md"
			animation="slide-from-bottom 0.3s ease-out"
		>
			<Card.Root bg="bg.panel" borderColor="border" borderWidth="1px" py="4">
				<Card.Header gap="1" pb="0">
					<ShopHeading size="sm">{t("cookie.bannerTitle")}</ShopHeading>
					<ShopMutedText textStyle="sm">
						{t("cookie.bannerDescription")}
					</ShopMutedText>
				</Card.Header>
				<Card.Footer pt="4">
					<HStack gap="3" w="full">
						<ShopButton
							variant="secondary"
							flex="1"
							onClick={rejectNonEssential}
						>
							{t("cookie.essentialOnly")}
						</ShopButton>
						<ShopButton variant="primary" flex="1" onClick={acceptAll}>
							{t("cookie.acceptAll")}
						</ShopButton>
					</HStack>
				</Card.Footer>
			</Card.Root>
		</Box>
	);
}
