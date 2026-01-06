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
			className="bg-gradient-to-b from-white via-gray-50 to-white py-24"
		>
			<div className="container mx-auto max-w-7xl px-4 md:px-6">
				<div className="mb-16 flex flex-col items-center justify-center space-y-4 text-center">
					<h2 className="text-pretty font-bold text-3xl text-gray-900 tracking-tighter sm:text-4xl md:text-5xl">
						{t("pricing.title")}
					</h2>
					<p className="mx-auto max-w-[700px] text-gray-600 md:text-xl">
						{t("pricing.subtitle")}
					</p>
				</div>

				<div className="mb-24 grid items-start gap-8 pt-6 lg:grid-cols-3">
					{tiers.map((tier) => (
						<div
							key={tier.key}
							className={`relative h-full rounded-xl border p-8 backdrop-blur-sm transition-all duration-500 hover:shadow-xl ${
								tier.highlighted
									? "border-brand-red/30 bg-white pt-12 shadow-lg"
									: "border-gray-200 bg-white/80 shadow-sm hover:border-gray-300/60"
							}`}
						>
							{tier.highlighted && (
								<div className="absolute start-1/2 -top-3 z-10 -translate-x-1/2">
									<span className="inline-block rounded-full bg-brand-red px-4 py-1.5 font-semibold text-white text-xs uppercase tracking-wide shadow-md">
										{t("pricing.recommended")}
									</span>
								</div>
							)}

							<div className="space-y-5">
								<div className="space-y-2">
									<h3 className="font-bold text-gray-900 text-xl">
										{tier.name}
									</h3>
									<p className="text-gray-500 text-sm">{tier.description}</p>
								</div>

								<div className="flex items-baseline gap-2">
									<span className="font-bold text-2xl text-gray-900 tracking-tight">
										€{tier.price}
									</span>
									<span className="text-gray-500 text-sm">{tier.period}</span>
								</div>

								<a
									href="/console/onboarding"
									className={`inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg px-6 font-semibold text-sm uppercase tracking-wide transition-all duration-300 ${
										tier.highlighted
											? "bg-brand-red text-white shadow-md hover:bg-brand-red-dark hover:shadow-lg active:scale-[0.98]"
											: "border border-gray-300 bg-white text-gray-900 shadow-sm hover:border-brand-red/50 hover:bg-gray-50 hover:shadow-md active:scale-[0.98]"
									}`}
								>
									<span>{tier.cta}</span>
									<ChevronRight className="size-4 transition-transform duration-300" />
								</a>

								<div className="border-gray-200 border-t pt-2">
									<ul className="space-y-3">
										{tier.features.map((feature) => (
											<li key={feature} className="flex items-start gap-2.5">
												<Check
													className="mt-0.5 size-4 shrink-0 text-brand-red"
													strokeWidth={2.5}
												/>
												<span className="text-gray-600 text-sm leading-relaxed">
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

				<p className="mt-2 text-center text-gray-500 text-xs">
					{t("comparison.note")}
				</p>

				<div className="mt-16">
					<h3 className="mb-8 text-center font-bold text-2xl text-gray-900">
						{t("comparison.title")}
					</h3>
					<div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
						<div className="overflow-x-auto">
							<table className="w-full">
								<thead>
									<tr className="border-gray-200 border-b">
										<th className="bg-gray-50 px-6 py-4 text-start font-semibold text-gray-700">
											{t("comparison.feature")}
										</th>
										<th className="relative bg-brand-red/10 px-6 py-4 text-center font-bold text-brand-red">
											<span>{t("comparison.menuvo")}</span>
										</th>
										<th className="bg-gray-50 px-6 py-4 text-center font-semibold text-gray-700">
											Lieferando
										</th>
										<th className="bg-gray-50 px-6 py-4 text-center font-semibold text-gray-700">
											Wolt
										</th>
									</tr>
								</thead>
								<tbody>
									{comparison.map((row) => (
										<tr
											key={row.feature}
											className="border-gray-100 border-b transition-colors last:border-b-0 hover:bg-gray-50"
										>
											<td className="px-6 py-4 font-medium text-gray-900">
												{row.feature}
											</td>
											<td className="relative bg-brand-red/5 px-6 py-4 text-center font-bold text-brand-red">
												<span className="relative z-10">{row.menuvo}</span>
											</td>
											<td className="px-6 py-4 text-center text-gray-600">
												{row.lieferando}
											</td>
											<td className="px-6 py-4 text-center text-gray-600">
												{row.wolt}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
					<p className="mt-3 text-center text-gray-500 text-xs">
						{t("comparison.provisionNote")}
					</p>
				</div>
			</div>
		</section>
	);
}
