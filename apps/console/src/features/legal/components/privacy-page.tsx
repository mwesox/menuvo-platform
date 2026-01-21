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

export function PrivacyPage() {
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
					Datenschutzerklärung
				</Heading>

				<VStack gap="6" align="stretch" textStyle="sm" lineHeight="relaxed">
					<Box as="section">
						<Heading as="h2" mb="2" fontWeight="medium" textStyle="base">
							1. Verantwortlicher
						</Heading>
						<Text>{company.name}</Text>
						<Text>{company.address}</Text>
						<Text>
							E-Mail:{" "}
							<Link href={`mailto:${company.email}`} textDecoration="underline">
								{company.email}
							</Link>
						</Text>
						<Text>
							Telefon:{" "}
							<Link href={`tel:${company.phone}`} textDecoration="underline">
								{company.phone}
							</Link>
						</Text>
					</Box>

					<Box as="section">
						<Heading as="h2" mb="2" fontWeight="medium" textStyle="base">
							2. Datenschutzbeauftragter
						</Heading>
						<Text>
							Bei Fragen zum Datenschutz erreichen Sie unseren
							Datenschutzbeauftragten unter:
						</Text>
						<Text mt="2">
							E-Mail:{" "}
							<Link
								href={`mailto:${company.dpoEmail}`}
								textDecoration="underline"
							>
								{company.dpoEmail}
							</Link>
						</Text>
					</Box>

					<Box as="section">
						<Heading as="h2" mb="2" fontWeight="medium" textStyle="base">
							3. Erhebung und Verarbeitung personenbezogener Daten
						</Heading>
						<Text>
							Wir erheben personenbezogene Daten, wenn Sie unsere Dienste
							nutzen. Dies umfasst:
						</Text>
						<Box as="ul" mt="2" listStylePosition="inside" listStyleType="disc">
							<Box as="li">
								Bestandsdaten (Name, Adresse, E-Mail bei Registrierung)
							</Box>
							<Box as="li">Nutzungsdaten (Zugriffszeiten, besuchte Seiten)</Box>
							<Box as="li">Zahlungsdaten (bei kostenpflichtigen Diensten)</Box>
						</Box>
					</Box>

					<Box as="section">
						<Heading as="h2" mb="2" fontWeight="medium" textStyle="base">
							4. Rechtsgrundlage
						</Heading>
						<Text>
							Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 DSGVO:
						</Text>
						<Box as="ul" mt="2" listStylePosition="inside" listStyleType="disc">
							<Box as="li">Einwilligung (lit. a)</Box>
							<Box as="li">Vertragserfüllung (lit. b)</Box>
							<Box as="li">Rechtliche Verpflichtung (lit. c)</Box>
							<Box as="li">Berechtigte Interessen (lit. f)</Box>
						</Box>
					</Box>

					<Box as="section">
						<Heading as="h2" mb="2" fontWeight="medium" textStyle="base">
							5. Ihre Rechte
						</Heading>
						<Text>Sie haben gemäß DSGVO folgende Rechte:</Text>
						<Box as="ul" mt="2" listStylePosition="inside" listStyleType="disc">
							<Box as="li">
								Auskunft über Ihre gespeicherten Daten (Art. 15)
							</Box>
							<Box as="li">Berichtigung unrichtiger Daten (Art. 16)</Box>
							<Box as="li">Löschung Ihrer Daten (Art. 17)</Box>
							<Box as="li">Einschränkung der Verarbeitung (Art. 18)</Box>
							<Box as="li">Datenübertragbarkeit (Art. 20)</Box>
							<Box as="li">Widerspruch gegen die Verarbeitung (Art. 21)</Box>
						</Box>
						<Text mt="2">
							Zur Ausübung Ihrer Rechte kontaktieren Sie uns unter:{" "}
							<Link href={`mailto:${company.email}`} textDecoration="underline">
								{company.email}
							</Link>
						</Text>
					</Box>

					<Box as="section">
						<Heading as="h2" mb="2" fontWeight="medium" textStyle="base">
							6. Cookies
						</Heading>
						<Text>
							Wir verwenden technisch notwendige Cookies für den Betrieb unserer
							Website. Diese sind für die Funktionalität erforderlich und können
							nicht deaktiviert werden.
						</Text>
					</Box>

					<Box as="section">
						<Heading as="h2" mb="2" fontWeight="medium" textStyle="base">
							7. Speicherdauer
						</Heading>
						<Text>
							Personenbezogene Daten werden gelöscht, sobald der Zweck der
							Speicherung entfällt und keine gesetzlichen Aufbewahrungspflichten
							bestehen.
						</Text>
					</Box>

					<Box as="section">
						<Heading as="h2" mb="2" fontWeight="medium" textStyle="base">
							8. Beschwerderecht
						</Heading>
						<Text>
							Sie haben das Recht, sich bei einer Aufsichtsbehörde zu beschweren
							(Art. 77 DSGVO). Zuständig ist die Datenschutzbehörde Ihres
							Bundeslandes.
						</Text>
					</Box>
				</VStack>
			</Container>
		</Box>
	);
}
