import { useTranslation } from "react-i18next";

export function BusinessCTA() {
	const { t } = useTranslation("business");

	function scrollToPricing() {
		const element = document.getElementById("pricing");
		if (element) {
			element.scrollIntoView({ behavior: "smooth" });
		}
	}

	return (
		<section className="relative overflow-hidden bg-gradient-to-b from-gray-100/50 via-white to-gray-50 py-24">
			<div className="container relative z-10 px-4 md:px-6">
				<div className="mx-auto max-w-4xl space-y-8 text-center">
					<div className="space-y-4">
						<h2 className="text-pretty font-bold text-3xl text-gray-900 tracking-tighter sm:text-4xl md:text-5xl">
							{t("cta.title")}
						</h2>
						<p className="mx-auto max-w-[600px] text-gray-600 md:text-xl">
							{t("cta.subtitle")}
						</p>
					</div>

					<div className="flex flex-col justify-center gap-3 sm:flex-row">
						<a
							href="https://console.menuvo.app/onboarding"
							className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-gradient-to-r from-brand-red to-brand-red-light px-10 py-6 font-bold text-lg text-white uppercase tracking-wide transition-all duration-300 hover:scale-[1.02] hover:from-brand-red-dark hover:to-brand-red hover:shadow-brand-red/20 hover:shadow-xl active:scale-[0.98]"
						>
							<span className="flex items-center gap-2">
								{t("cta.button")}
								<span className="text-xl">→</span>
							</span>
						</a>
						<button
							type="button"
							onClick={scrollToPricing}
							className="cursor-pointer rounded-lg border-2 border-gray-300 bg-white px-10 py-6 font-semibold text-gray-700 text-lg uppercase tracking-wide shadow-lg transition-all duration-300 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900 hover:shadow-xl"
						>
							{t("cta.secondary")}
						</button>
					</div>

					<p className="text-gray-500 text-sm">{t("cta.trustStatement")}</p>
				</div>
			</div>
		</section>
	);
}
