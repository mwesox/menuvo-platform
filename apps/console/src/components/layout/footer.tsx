import { Link as ChakraLink, Stack, Text } from "@chakra-ui/react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

const footerLinks = [
	{ to: "/legal/impressum", labelKey: "impressum" },
	{ to: "/legal/privacy", labelKey: "privacyPolicy" },
] as const;

export function Footer() {
	const { t } = useTranslation("legal");
	const currentYear = new Date().getFullYear();

	return (
		<Stack
			as="footer"
			gap="4"
			align="center"
			mt="auto"
			borderTopWidth="1px"
			bg="bg"
			px={{ base: "4", lg: "6" }}
			py="6"
		>
			<Stack
				as="nav"
				aria-label={t("footer.dataProtection")}
				direction="row"
				flexWrap="wrap"
				align="center"
				justify="center"
				gapX="6"
				gapY="2"
				textStyle="sm"
			>
				{footerLinks.map((link) => (
					<ChakraLink
						key={link.to}
						asChild
						color="fg.muted"
						_hover={{ color: "fg" }}
					>
						<Link to={link.to}>{t(`footer.${link.labelKey}`)}</Link>
					</ChakraLink>
				))}
			</Stack>

			<Text color="fg.muted" textStyle="xs">
				&copy; {currentYear} Menuvo. {t("footer.allRightsReserved")}
			</Text>
		</Stack>
	);
}
