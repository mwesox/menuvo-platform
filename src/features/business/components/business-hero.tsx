import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function BusinessHero() {
	const { t } = useTranslation("business");
	const [animated, setAnimated] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setAnimated(true);
		}, 100);
		return () => clearTimeout(timer);
	}, []);

	function scrollToFeatures() {
		const element = document.getElementById("features");
		if (element) {
			element.scrollIntoView({ behavior: "smooth" });
		}
	}

	return (
		<section className="relative min-h-[75vh] flex items-start md:items-center justify-center overflow-hidden pt-20 md:pt-24 pb-16 bg-gradient-to-b from-gray-50 via-white to-gray-50">
			<div
				className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-gray-100/50 via-transparent to-transparent pointer-events-none"
				aria-hidden="true"
			/>

			<div className="container px-4 md:px-6 max-w-6xl mx-auto relative z-10">
				<div className="grid lg:grid-cols-3 gap-8 lg:gap-14 items-start bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200/50">
					<div className="lg:col-span-2 flex flex-col space-y-5">
						<h1
							className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 text-pretty transition-all duration-800 ease-out"
							style={{
								opacity: animated ? 1 : 0,
								filter: animated ? "blur(0)" : "blur(10px)",
								transform: animated ? "translateY(0)" : "translateY(20px)",
							}}
						>
							{t("hero.headline")}
						</h1>

						<p
							className="text-xl md:text-2xl font-semibold leading-tight text-gray-700 transition-all duration-600 ease-out delay-200"
							style={{
								opacity: animated ? 1 : 0,
								transform: animated ? "translateY(0)" : "translateY(20px)",
							}}
						>
							<span className="bg-gradient-to-r from-brand-red via-brand-red-light to-brand-orange bg-clip-text text-transparent">
								{t("hero.subtitle")}
							</span>
						</p>

						<p
							className="text-lg text-gray-600 leading-relaxed transition-all duration-600 ease-out delay-300"
							style={{
								opacity: animated ? 1 : 0,
								transform: animated ? "translateY(0)" : "translateY(20px)",
							}}
						>
							{t("hero.description")}
						</p>

						<div
							className="flex flex-col sm:flex-row gap-4 pt-4 transition-all duration-600 ease-out delay-400"
							style={{
								opacity: animated ? 1 : 0,
								transform: animated ? "translateY(0)" : "translateY(20px)",
							}}
						>
							<a
								href="/console/onboarding"
								className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-lg font-semibold transition-all duration-300 bg-gradient-to-r from-brand-red to-brand-red-light text-white hover:from-brand-red-dark hover:to-brand-red hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] px-8 py-4 uppercase tracking-wide"
							>
								{t("cta.primary")} →
							</a>
							<button
								type="button"
								onClick={scrollToFeatures}
								className="text-lg font-semibold rounded-lg border-2 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-all duration-200 uppercase tracking-wide cursor-pointer px-8 py-4"
							>
								{t("cta.secondary")}
							</button>
						</div>

						<div
							className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-gray-500 pt-4 transition-opacity duration-600 ease-out delay-500"
							style={{ opacity: animated ? 1 : 0 }}
						>
							<div className="flex items-center gap-2">
								<Check className="size-4 text-brand-red" strokeWidth={2.5} />
								<span className="font-medium">{t("trust.noSetupFee")}</span>
							</div>
							<div className="flex items-center gap-2">
								<Check className="size-4 text-brand-red" strokeWidth={2.5} />
								<span className="font-medium">{t("trust.gdpr")}</span>
							</div>
							<div className="flex items-center gap-2">
								<Check className="size-4 text-brand-red" strokeWidth={2.5} />
								<span className="font-medium">{t("trust.hostedDe")}</span>
							</div>
						</div>
					</div>

					<div
						className="lg:col-span-1 w-full transition-all duration-800 ease-out delay-600"
						style={{
							opacity: animated ? 1 : 0,
							transform: animated ? "translateX(0)" : "translateX(40px)",
						}}
					>
						<div className="relative group">
							<div className="absolute -inset-2 bg-gradient-to-br from-brand-red/10 via-transparent to-brand-red/5 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
							<div className="relative rounded-xl overflow-hidden shadow-lg border border-gray-200/40 hover:border-gray-300/60 transition-all duration-500 hover:shadow-xl">
								<img
									src="/hero-restaurant.webp"
									srcSet="/hero-restaurant-sm.webp 640w, /hero-restaurant-md.webp 1024w, /hero-restaurant.webp 1920w"
									sizes="(max-width: 640px) 640px, (max-width: 1024px) 1024px, 1920px"
									alt="Menuvo Dashboard - Digitales Bestellsystem"
									className="w-full h-auto"
									loading="eager"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent pointer-events-none" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
