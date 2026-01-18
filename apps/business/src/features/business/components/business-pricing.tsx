import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export function BusinessPricing() {
	const { t } = useTranslation("business");

	return (
		<section id="pricing" className="bg-white py-16">
			<div className="container mx-auto max-w-3xl px-4 md:px-6">
				{/* Compact Header */}
				<div className="mb-8 text-center">
					<h2 className="font-semibold text-2xl text-gray-900">
						{t("pricing.title")}
					</h2>
					<p className="mt-1 text-gray-500 text-sm">{t("pricing.subtitle")}</p>
				</div>

				{/* Pricing Card - Compact */}
				<div className="mx-auto max-w-sm rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-6 shadow-sm">
					{/* Main Price */}
					<div className="mb-4 flex items-baseline justify-center gap-3">
						<span className="font-bold text-4xl text-gray-900 tabular-nums">
							0€
						</span>
						<span className="text-gray-400">/</span>
						<span className="font-bold text-4xl text-brand-red tabular-nums">
							2,9%
						</span>
					</div>
					<p className="mb-5 text-center text-gray-500 text-xs">
						{t("pricing.plan.monthlyLabel")} +{" "}
						{t("pricing.plan.transactionLabel")}
					</p>

					{/* Fee Breakdown - Inline */}
					<div className="mb-5 space-y-1.5 border-gray-100 border-t pt-4 text-xs">
						<div className="flex justify-between text-gray-500">
							<span>{t("pricing.fees.menuvo.label")}</span>
							<span className="font-medium text-gray-700">2,9%</span>
						</div>
						<div className="flex justify-between text-gray-500">
							<span>{t("pricing.fees.mollie.label")}</span>
							<span className="font-medium text-gray-700">
								{t("pricing.fees.mollie.value")}
							</span>
						</div>
						<div className="flex justify-between border-gray-100 border-t pt-1.5 font-medium text-gray-900">
							<span>{t("pricing.fees.total.label")}</span>
							<span>{t("pricing.fees.total.value")}</span>
						</div>
					</div>

					{/* CTA */}
					<a
						href="https://console.menuvo.app/onboarding"
						className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-red px-5 py-3 font-medium text-sm text-white transition-colors hover:bg-brand-red-dark"
					>
						{t("pricing.ctaButton")}
						<ArrowRight className="size-4" />
					</a>
				</div>

				<p className="mt-6 text-center text-gray-400 text-xs">
					{t("pricing.note")}
				</p>
			</div>
		</section>
	);
}
