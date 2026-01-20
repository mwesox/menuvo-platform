import { Button } from "@menuvo/ui";
import { ArrowLeft } from "lucide-react";
import company from "../data/company.json";

export function ImpressumPage() {
	return (
		<div className="min-h-screen bg-background">
			<div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
				<Button
					variant="ghost"
					size="sm"
					className="mb-4"
					onClick={() => window.history.back()}
				>
					<ArrowLeft className="mr-2 size-4" />
					Zurück
				</Button>

				<h1 className="mb-8 font-semibold text-2xl">Impressum</h1>

				<div className="space-y-6 text-sm leading-relaxed">
					<section>
						<h2 className="mb-2 font-medium text-base">
							Angaben gemäß § 5 TMG
						</h2>
						<p>{company.name}</p>
						<p>{company.address}</p>
					</section>

					<section>
						<h2 className="mb-2 font-medium text-base">Kontakt</h2>
						<p>
							Telefon:{" "}
							<a href={`tel:${company.phone}`} className="underline">
								{company.phone}
							</a>
						</p>
						<p>
							E-Mail:{" "}
							<a href={`mailto:${company.email}`} className="underline">
								{company.email}
							</a>
						</p>
					</section>

					<section>
						<h2 className="mb-2 font-medium text-base">Handelsregister</h2>
						<p>{company.register}</p>
					</section>

					<section>
						<h2 className="mb-2 font-medium text-base">Vertreten durch</h2>
						<p>Geschäftsführer: {company.managingDirector}</p>
					</section>

					<section>
						<h2 className="mb-2 font-medium text-base">EU-Streitschlichtung</h2>
						<p>
							Die Europäische Kommission stellt eine Plattform zur
							Online-Streitbeilegung (OS) bereit:{" "}
							<a
								href="https://ec.europa.eu/consumers/odr/"
								target="_blank"
								rel="noopener noreferrer"
								className="break-all text-primary underline"
							>
								https://ec.europa.eu/consumers/odr/
							</a>
						</p>
						<p className="mt-2">
							Unsere E-Mail-Adresse finden Sie oben im Impressum.
						</p>
					</section>

					<section>
						<h2 className="mb-2 font-medium text-base">
							Verbraucherstreitbeilegung
						</h2>
						<p>
							Wir sind nicht bereit oder verpflichtet, an
							Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
							teilzunehmen.
						</p>
					</section>
				</div>
			</div>
		</div>
	);
}
