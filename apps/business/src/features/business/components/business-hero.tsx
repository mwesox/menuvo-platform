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
		const element = document.getElementById("domains");
		if (element) {
			element.scrollIntoView({ behavior: "smooth" });
		}
	}

	return (
		<section className="relative flex min-h-[75vh] items-start justify-center overflow-hidden bg-gradient-to-b from-gray-50 via-white to-gray-50 pt-20 pb-16 md:items-center md:pt-24">
			<div
				className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-gray-100/50 via-transparent to-transparent"
				aria-hidden="true"
			/>

			<div className="container relative z-10 mx-auto max-w-6xl px-4 md:px-6">
				<div className="grid items-start gap-8 rounded-2xl border border-gray-200/50 bg-white/90 p-8 shadow-xl backdrop-blur-sm md:p-12 lg:grid-cols-3 lg:gap-14">
					<div className="flex flex-col space-y-5 lg:col-span-2">
						{/* Badge */}
						<div
							className="transition-all duration-600 ease-out"
							style={{
								opacity: animated ? 1 : 0,
								transform: animated ? "translateY(0)" : "translateY(10px)",
							}}
						>
							<span className="inline-block rounded-full bg-brand-red/10 px-4 py-1.5 font-semibold text-brand-red text-sm">
								{t("hero.badge")}
							</span>
						</div>

						<h1
							className="text-pretty font-bold text-4xl text-gray-900 tracking-tight transition-all duration-800 ease-out md:text-5xl lg:text-6xl"
							style={{
								opacity: animated ? 1 : 0,
								filter: animated ? "blur(0)" : "blur(10px)",
								transform: animated ? "translateY(0)" : "translateY(20px)",
							}}
						>
							{t("hero.headline")}
						</h1>

						<p
							className="font-semibold text-gray-700 text-xl leading-tight transition-all delay-200 duration-600 ease-out md:text-2xl"
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
							className="text-gray-600 text-lg leading-relaxed transition-all delay-300 duration-600 ease-out"
							style={{
								opacity: animated ? 1 : 0,
								transform: animated ? "translateY(0)" : "translateY(20px)",
							}}
						>
							{t("hero.description")}
						</p>

						<div
							className="flex flex-col gap-4 pt-4 transition-all delay-400 duration-600 ease-out sm:flex-row"
							style={{
								opacity: animated ? 1 : 0,
								transform: animated ? "translateY(0)" : "translateY(20px)",
							}}
						>
							<a
								href="https://console.menuvo.app/onboarding"
								className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-gradient-to-r from-brand-red to-brand-red-light px-8 py-4 font-semibold text-lg text-white uppercase tracking-wide transition-all duration-300 hover:scale-[1.02] hover:from-brand-red-dark hover:to-brand-red hover:shadow-lg active:scale-[0.98]"
							>
								{t("cta.primary")} →
							</a>
							<button
								type="button"
								onClick={scrollToFeatures}
								className="cursor-pointer rounded-lg border-2 border-gray-300 bg-white px-8 py-4 font-semibold text-gray-700 text-lg uppercase tracking-wide transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 hover:text-gray-900"
							>
								{t("cta.secondary")}
							</button>
						</div>

						<div
							className="flex flex-wrap gap-x-8 gap-y-3 pt-4 text-gray-500 text-sm transition-opacity delay-500 duration-600 ease-out"
							style={{ opacity: animated ? 1 : 0 }}
						>
							<div className="flex items-center gap-2">
								<Check className="size-4 text-brand-red" strokeWidth={2.5} />
								<span className="font-medium">{t("trust.noMonthlyFee")}</span>
							</div>
							<div className="flex items-center gap-2">
								<Check className="size-4 text-brand-red" strokeWidth={2.5} />
								<span className="font-medium">{t("trust.payPerOrder")}</span>
							</div>
							<div className="flex items-center gap-2">
								<Check className="size-4 text-brand-red" strokeWidth={2.5} />
								<span className="font-medium">{t("trust.noHardware")}</span>
							</div>
						</div>
					</div>

					<div
						className="w-full transition-all delay-600 duration-800 ease-out lg:col-span-1"
						style={{
							opacity: animated ? 1 : 0,
							transform: animated ? "translateX(0)" : "translateX(40px)",
						}}
					>
						<div className="group relative">
							<div className="absolute -inset-2 rounded-xl bg-gradient-to-br from-brand-red/10 via-transparent to-brand-red/5 opacity-0 blur-xl transition-opacity duration-700 group-hover:opacity-100" />
							<div className="relative overflow-hidden rounded-xl border border-gray-200/40 shadow-lg transition-all duration-500 hover:border-gray-300/60 hover:shadow-xl">
								<img
									src="/hero-restaurant.webp"
									srcSet="/hero-restaurant-sm.webp 640w, /hero-restaurant-md.webp 1024w, /hero-restaurant.webp 1920w"
									sizes="(max-width: 640px) 640px, (max-width: 1024px) 1024px, 1920px"
									alt="Menuvo Dashboard - Digitales Bestellsystem"
									className="h-auto w-full"
									loading="eager"
								/>
								<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
