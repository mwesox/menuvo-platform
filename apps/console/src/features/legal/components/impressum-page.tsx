import {
	Box,
	Button,
	Container,
	Heading,
	Icon,
	Link,
	Text,
	VStack,
} from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import company from "../data/company.json";

export function ImpressumPage() {
	return (
		<Box minH="screen" bg="background">
			<Container maxW="3xl" px={{ base: "4", md: "6" }} py="8">
				<Button
					variant="ghost"
					size="sm"
					mb="4"
					onClick={() => window.history.back()}
				>
					<Icon w="4" h="4" me="2">
						<ArrowLeft />
					</Icon>
					Zurück
				</Button>

				<Heading as="h1" mb="8" fontWeight="semibold" textStyle="2xl">
					Impressum
				</Heading>

				<VStack gap="6" align="stretch" textStyle="sm" lineHeight="relaxed">
					<Box as="section">
						<Heading as="h2" mb="2" fontWeight="medium" textStyle="base">
							Angaben gemäß § 5 TMG
						</Heading>
						<Text>{company.name}</Text>
						<Text>{company.address}</Text>
					</Box>

					<Box as="section">
						<Heading as="h2" mb="2" fontWeight="medium" textStyle="base">
							Kontakt
						</Heading>
						<Text>
							Telefon:{" "}
							<Link href={`tel:${company.phone}`} textDecoration="underline">
								{company.phone}
							</Link>
						</Text>
						<Text>
							E-Mail:{" "}
							<Link href={`mailto:${company.email}`} textDecoration="underline">
								{company.email}
							</Link>
						</Text>
					</Box>

					<Box as="section">
						<Heading as="h2" mb="2" fontWeight="medium" textStyle="base">
							Handelsregister
						</Heading>
						<Text>{company.register}</Text>
					</Box>

					<Box as="section">
						<Heading as="h2" mb="2" fontWeight="medium" textStyle="base">
							Vertreten durch
						</Heading>
						<Text>Geschäftsführer: {company.managingDirector}</Text>
					</Box>

					<Box as="section">
						<Heading as="h2" mb="2" fontWeight="medium" textStyle="base">
							EU-Streitschlichtung
						</Heading>
						<Text>
							Die Europäische Kommission stellt eine Plattform zur
							Online-Streitbeilegung (OS) bereit:{" "}
							<Link
								href="https://ec.europa.eu/consumers/odr/"
								target="_blank"
								rel="noopener noreferrer"
								wordBreak="break-all"
								color="primary"
								textDecoration="underline"
							>
								https://ec.europa.eu/consumers/odr/
							</Link>
						</Text>
						<Text mt="2">
							Unsere E-Mail-Adresse finden Sie oben im Impressum.
						</Text>
					</Box>

					<Box as="section">
						<Heading as="h2" mb="2" fontWeight="medium" textStyle="base">
							Verbraucherstreitbeilegung
						</Heading>
						<Text>
							Wir sind nicht bereit oder verpflichtet, an
							Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
							teilzunehmen.
						</Text>
					</Box>
				</VStack>
			</Container>
		</Box>
	);
}
