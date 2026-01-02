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
		<section className="relative py-24 overflow-hidden bg-gradient-to-b from-gray-100/50 via-white to-gray-50 dark:from-gray-800/50 dark:via-gray-900 dark:to-gray-800/50">
			<div className="container px-4 md:px-6 relative z-10">
				<div className="mx-auto max-w-4xl text-center space-y-8">
					<div className="space-y-4">
						<h2 className="text-3xl font-sans font-bold tracking-tighter sm:text-4xl md:text-5xl text-gray-900 dark:text-white">
							{t("cta.title")}
						</h2>
						<p className="mx-auto max-w-[600px] font-sans text-gray-600 dark:text-gray-400 md:text-xl">
							{t("cta.subtitle")}
						</p>
					</div>

					<div className="flex flex-col gap-3 sm:flex-row justify-center">
						<a
							href="/console/onboarding"
							className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-lg font-sans font-bold transition-all duration-300 bg-gradient-to-r from-[#e1393b] to-[#ff6b6b] text-white hover:from-[#c32d2f] hover:to-[#e55555] hover:shadow-xl hover:shadow-[#e1393b]/20 hover:scale-[1.02] active:scale-[0.98] px-10 py-6 uppercase tracking-wide"
						>
							<span className="flex items-center gap-2">
								{t("cta.button")}
								<span className="text-xl">→</span>
							</span>
						</a>
						<button
							type="button"
							onClick={scrollToPricing}
							className="text-lg font-sans font-semibold rounded-lg border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-all duration-300 shadow-lg hover:shadow-xl px-10 py-6 uppercase tracking-wide cursor-pointer"
						>
							{t("cta.secondary")}
						</button>
					</div>

					<p className="font-sans text-sm text-gray-500 dark:text-gray-400">
						{t("cta.trustStatement")}
					</p>
				</div>
			</div>
		</section>
	);
}
