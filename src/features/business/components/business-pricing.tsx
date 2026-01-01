import { Link } from "@tanstack/react-router";
import { Check, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

const tierKeys = ["starter", "professional", "max"] as const;

export function BusinessPricing() {
	const { t } = useTranslation("business");

	const tiers = tierKeys.map((key) => ({
		key,
		name: t(`pricing.${key}.name`),
		price: t(`pricing.${key}.price`),
		period: t(`pricing.${key}.period`),
		description: t(`pricing.${key}.description`),
		features: t(`pricing.${key}.features`, { returnObjects: true }) as string[],
		cta: key === "starter" ? t("pricing.ctaStart") : t("pricing.ctaUpgrade"),
		highlighted: key === "professional",
	}));

	const comparison = [
		{
			feature: t("comparison.commission"),
			menuvo: t("comparison.commissionMenuvo"),
			lieferando: t("comparison.commissionLieferando"),
			wolt: t("comparison.commissionWolt"),
		},
		{
			feature: t("comparison.monthly"),
			menuvo: t("comparison.monthlyMenuvo"),
			lieferando: t("comparison.monthlyLieferando"),
			wolt: t("comparison.monthlyWolt"),
		},
		{
			feature: t("comparison.domain"),
			menuvo: t("comparison.yes"),
			lieferando: t("comparison.no"),
			wolt: t("comparison.no"),
		},
		{
			feature: t("comparison.data"),
			menuvo: t("comparison.yes"),
			lieferando: t("comparison.no"),
			wolt: t("comparison.no"),
		},
	];

	return (
		<section
			id="pricing"
			className="py-24 bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
		>
			<div className="container px-4 md:px-6 max-w-7xl mx-auto">
				<div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
					<h2 className="text-3xl font-sans font-bold tracking-tighter sm:text-4xl md:text-5xl text-gray-900 dark:text-white">
						{t("pricing.title")}
					</h2>
					<p className="mx-auto max-w-[700px] font-sans text-gray-600 dark:text-gray-400 md:text-xl">
						{t("pricing.subtitle")}
					</p>
				</div>

				<div className="grid gap-8 lg:grid-cols-3 mb-24 items-start pt-6">
					{tiers.map((tier) => (
						<div
							key={tier.key}
							className={`relative h-full rounded-xl border p-8 transition-all duration-500 backdrop-blur-sm hover:shadow-xl ${
								tier.highlighted
									? "border-[#e1393b]/30 shadow-lg pt-12 bg-white dark:bg-gray-800"
									: "border-gray-200 dark:border-gray-700 shadow-sm hover:border-gray-300/60 bg-white/80 dark:bg-gray-800/80"
							}`}
						>
							{tier.highlighted && (
								<div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
									<span className="inline-block rounded-full bg-[#e1393b] px-4 py-1.5 text-xs font-sans font-semibold text-white shadow-md uppercase tracking-wide">
										{t("pricing.recommended")}
									</span>
								</div>
							)}

							<div className="space-y-5">
								<div className="space-y-2">
									<h3 className="text-xl font-sans font-bold text-gray-900 dark:text-white">
										{tier.name}
									</h3>
									<p className="font-sans text-sm text-gray-500 dark:text-gray-400">
										{tier.description}
									</p>
								</div>

								<div className="flex items-baseline gap-2">
									<span className="text-2xl font-sans font-bold tracking-tight text-gray-900 dark:text-white">
										€{tier.price}
									</span>
									<span className="font-sans text-sm text-gray-500 dark:text-gray-400">
										{tier.period}
									</span>
								</div>

								<Link
									to="/auth/register"
									className={`w-full inline-flex items-center justify-center gap-2 h-11 rounded-lg px-6 text-sm font-sans font-semibold transition-all duration-300 cursor-pointer uppercase tracking-wide ${
										tier.highlighted
											? "bg-[#e1393b] text-white shadow-md hover:bg-[#c32d2f] hover:shadow-lg active:scale-[0.98]"
											: "bg-white border border-gray-300 text-gray-900 hover:border-[#e1393b]/50 hover:bg-gray-50 shadow-sm hover:shadow-md active:scale-[0.98]"
									}`}
								>
									<span>{tier.cta}</span>
									<ChevronRight className="w-4 h-4 transition-transform duration-300" />
								</Link>

								<div className="pt-2 border-t border-gray-200 dark:border-gray-700">
									<ul className="space-y-3">
										{tier.features.map((feature) => (
											<li key={feature} className="flex items-start gap-2.5">
												<Check
													className="h-4 w-4 text-[#e1393b] shrink-0 mt-0.5"
													strokeWidth={2.5}
												/>
												<span className="font-sans text-sm leading-relaxed text-gray-600 dark:text-gray-400">
													{feature}
												</span>
											</li>
										))}
									</ul>
								</div>
							</div>
						</div>
					))}
				</div>

				<p className="mt-2 font-sans text-xs text-gray-500 dark:text-gray-400 text-center">
					{t("comparison.note")}
				</p>

				<div className="mt-16">
					<h3 className="text-2xl font-sans font-bold text-center mb-8 text-gray-900 dark:text-white">
						{t("comparison.title")}
					</h3>
					<div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl">
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-b border-gray-200 dark:border-gray-700">
										<th className="px-6 py-4 text-left font-sans font-semibold bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">
											{t("comparison.feature")}
										</th>
										<th className="px-6 py-4 text-center font-sans font-bold bg-[#e1393b]/10 text-[#e1393b] relative">
											<span>{t("comparison.menuvo")}</span>
										</th>
										<th className="px-6 py-4 text-center font-sans font-semibold bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">
											Lieferando
										</th>
										<th className="px-6 py-4 text-center font-sans font-semibold bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">
											Wolt
										</th>
									</tr>
								</thead>
								<tbody>
									{comparison.map((row) => (
										<tr
											key={row.feature}
											className="border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors"
										>
											<td className="px-6 py-4 font-sans font-medium text-gray-900 dark:text-white">
												{row.feature}
											</td>
											<td className="px-6 py-4 text-center font-sans font-bold text-[#e1393b] bg-[#e1393b]/5 relative">
												<span className="relative z-10">{row.menuvo}</span>
											</td>
											<td className="px-6 py-4 text-center font-sans text-gray-600 dark:text-gray-400">
												{row.lieferando}
											</td>
											<td className="px-6 py-4 text-center font-sans text-gray-600 dark:text-gray-400">
												{row.wolt}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
					<p className="mt-3 font-sans text-xs text-gray-500 dark:text-gray-400 text-center">
						{t("comparison.provisionNote")}
					</p>
				</div>
			</div>
		</section>
	);
}
