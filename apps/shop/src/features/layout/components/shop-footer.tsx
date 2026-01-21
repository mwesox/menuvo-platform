import {
	Box,
	Button,
	HStack,
	Image,
	Separator,
	Text,
	VStack,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useCookieConsentOptional } from "../../shared/contexts/cookie-consent-context";
import { LanguageSwitcher } from "./language-switcher";

function PoweredByMenuvo() {
	const { t } = useTranslation("legal");

	return (
		<HStack gap="2" justify="center">
			<Text color="fg.muted" fontSize="sm">
				{t("footer.poweredBy")}
			</Text>
			<Image src="/menuvo-logo.svg" alt="Menuvo" h="6" />
		</HStack>
	);
}

function FooterLegalLinks() {
	const { t } = useTranslation("legal");
	const cookieConsent = useCookieConsentOptional();

	return (
		<HStack gap="2" justify="center" fontSize="sm">
			<Button
				variant="plain"
				size="sm"
				h="auto"
				p="0"
				color="fg.muted"
				_hover={{ color: "fg" }}
				asChild
			>
				<a href="/legal/impressum" target="_blank" rel="noopener noreferrer">
					{t("footer.impressum")}
				</a>
			</Button>
			<Separator orientation="vertical" h="4" />
			<Button
				variant="plain"
				size="sm"
				h="auto"
				p="0"
				color="fg.muted"
				_hover={{ color: "fg" }}
				asChild
			>
				<a href="/legal/privacy" target="_blank" rel="noopener noreferrer">
					{t("footer.privacy")}
				</a>
			</Button>
			{cookieConsent && (
				<>
					<Separator orientation="vertical" h="4" />
					<Button
						variant="plain"
						size="sm"
						h="auto"
						p="0"
						color="fg.muted"
						_hover={{ color: "fg" }}
						onClick={cookieConsent.openSettings}
					>
						{t("footer.cookies")}
					</Button>
				</>
			)}
		</HStack>
	);
}

function FooterCopyright() {
	const { t } = useTranslation("legal");
	const year = new Date().getFullYear();

	return (
		<Text textAlign="center" color="fg.muted" fontSize="xs">
			{t("footer.copyright", { year })}
		</Text>
	);
}

export function ShopFooter() {
	return (
		<Box
			as="footer"
			borderTopWidth="1px"
			borderColor="border"
			bg="bg"
			px="4"
			py="6"
		>
			<VStack gap="4">
				<HStack gap="4" justify="center">
					<PoweredByMenuvo />
					<LanguageSwitcher />
				</HStack>
				<FooterLegalLinks />
				<FooterCopyright />
			</VStack>
		</Box>
	);
}
