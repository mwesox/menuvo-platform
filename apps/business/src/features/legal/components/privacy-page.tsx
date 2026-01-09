import { Button } from "@menuvo/ui/components/button";
import { ArrowLeft } from "lucide-react";
import company from "../data/company.json";

export function PrivacyPage() {
	return (
		<div className="@container">
			<div className="mx-auto max-w-3xl @md:px-6 px-4 @md:py-8 py-6">
				<Button
					variant="ghost"
					size="sm"
					className="mb-4"
					onClick={() => window.history.back()}
				>
					<ArrowLeft className="mr-2 size-4" />
					Zurück
				</Button>

				<h1 className="@md:mb-8 mb-6 font-semibold @md:text-2xl text-xl">
					Datenschutzerklärung
				</h1>

				<div className="@md:space-y-6 space-y-5 text-sm leading-relaxed">
					<section>
						<h2 className="mb-2 font-medium text-base">1. Verantwortlicher</h2>
						<p>{company.name}</p>
						<p>{company.address}</p>
						<p>
							E-Mail:{" "}
							<a href={`mailto:${company.email}`} className="underline">
								{company.email}
							</a>
						</p>
						<p>
							Telefon:{" "}
							<a href={`tel:${company.phone}`} className="underline">
								{company.phone}
							</a>
						</p>
					</section>

					<section>
						<h2 className="mb-2 font-medium text-base">
							2. Erhebung und Verarbeitung personenbezogener Daten
						</h2>
						<p>
							Wir erheben personenbezogene Daten, wenn Sie unsere Dienste
							nutzen. Dies umfasst:
						</p>
						<ul className="mt-2 list-inside list-disc space-y-1">
							<li>Bestandsdaten (Name, Adresse, E-Mail bei Registrierung)</li>
							<li>Nutzungsdaten (Zugriffszeiten, besuchte Seiten)</li>
							<li>Zahlungsdaten (bei kostenpflichtigen Diensten)</li>
						</ul>
					</section>

					<section>
						<h2 className="mb-2 font-medium text-base">3. Rechtsgrundlage</h2>
						<p>
							Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 DSGVO:
						</p>
						<ul className="mt-2 list-inside list-disc space-y-1">
							<li>Einwilligung (lit. a)</li>
							<li>Vertragserfüllung (lit. b)</li>
							<li>Rechtliche Verpflichtung (lit. c)</li>
							<li>Berechtigte Interessen (lit. f)</li>
						</ul>
					</section>

					<section>
						<h2 className="mb-2 font-medium text-base">4. Ihre Rechte</h2>
						<p>Sie haben gemäß DSGVO folgende Rechte:</p>
						<ul className="mt-2 list-inside list-disc space-y-1">
							<li>Auskunft über Ihre gespeicherten Daten (Art. 15)</li>
							<li>Berichtigung unrichtiger Daten (Art. 16)</li>
							<li>Löschung Ihrer Daten (Art. 17)</li>
							<li>Einschränkung der Verarbeitung (Art. 18)</li>
							<li>Datenübertragbarkeit (Art. 20)</li>
							<li>Widerspruch gegen die Verarbeitung (Art. 21)</li>
						</ul>
						<p className="mt-2">
							Zur Ausübung Ihrer Rechte kontaktieren Sie uns unter:{" "}
							<a href={`mailto:${company.email}`} className="underline">
								{company.email}
							</a>
						</p>
					</section>

					<section>
						<h2 className="mb-2 font-medium text-base">5. Cookies</h2>
						<p>
							Wir verwenden technisch notwendige Cookies für den Betrieb unserer
							Website. Diese sind für die Funktionalität erforderlich und können
							nicht deaktiviert werden.
						</p>
					</section>

					<section>
						<h2 className="mb-2 font-medium text-base">6. Speicherdauer</h2>
						<p>
							Personenbezogene Daten werden gelöscht, sobald der Zweck der
							Speicherung entfällt und keine gesetzlichen Aufbewahrungspflichten
							bestehen.
						</p>
					</section>

					<section>
						<h2 className="mb-2 font-medium text-base">7. Beschwerderecht</h2>
						<p>
							Sie haben das Recht, sich bei einer Aufsichtsbehörde zu beschweren
							(Art. 77 DSGVO). Zuständig ist die Datenschutzbehörde Ihres
							Bundeslandes.
						</p>
					</section>
				</div>
			</div>
		</div>
	);
}
