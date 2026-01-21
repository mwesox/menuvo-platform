import {
	Card,
	Container,
	Heading,
	HStack,
	Icon,
	Link,
	SimpleGrid,
	Text,
	VStack,
} from "@chakra-ui/react";
import { HelpCircle, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

export function HelpPage() {
	const { t } = useTranslation("console-help");

	return (
		<Container maxW="4xl" py="8">
			<VStack gap="6" align="stretch">
				<VStack gap="0" align="start">
					<Heading
						as="h1"
						fontWeight="semibold"
						textStyle="2xl"
						letterSpacing="tight"
					>
						{t("title")}
					</Heading>
					<Text color="fg.muted">{t("description")}</Text>
				</VStack>

				<SimpleGrid columns={{ base: 1, md: 2 }} gap="6">
					<Card.Root>
						<Card.Header>
							<Card.Title>
								<HStack gap="2" align="center">
									<Icon w="5" h="5">
										<HelpCircle />
									</Icon>
									<Text>{t("documentation.title")}</Text>
								</HStack>
							</Card.Title>
							<Card.Description>
								{t("documentation.description")}
							</Card.Description>
						</Card.Header>
						<Card.Body>
							<Text color="fg.muted" textStyle="sm">
								{t("comingSoon")}
							</Text>
						</Card.Body>
					</Card.Root>

					<Card.Root>
						<Card.Header>
							<Card.Title>
								<HStack gap="2" align="center">
									<Icon w="5" h="5">
										<Mail />
									</Icon>
									<Text>{t("contact.title")}</Text>
								</HStack>
							</Card.Title>
							<Card.Description>{t("contact.description")}</Card.Description>
						</Card.Header>
						<Card.Body>
							<Link
								href="mailto:support@menuvo.app"
								color="primary"
								textStyle="sm"
								_hover={{ textDecoration: "underline" }}
							>
								support@menuvo.app
							</Link>
						</Card.Body>
					</Card.Root>
				</SimpleGrid>
			</VStack>
		</Container>
	);
}
