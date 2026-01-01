import {
	Bot,
	Clock,
	DollarSign,
	Globe,
	Shield,
	Smartphone,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const featureIcons = {
	aiMenu: Bot,
	revenue: DollarSign,
	setup: Clock,
	multilingual: Globe,
	mobile: Smartphone,
	gdpr: Shield,
} as const;

const featureKeys = [
	"aiMenu",
	"revenue",
	"setup",
	"multilingual",
	"mobile",
	"gdpr",
] as const;

export function BusinessFeatures() {
	const { t } = useTranslation("business");
	const [animated, setAnimated] = useState(false);
	const sectionRef = useRef<HTMLElement>(null);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setAnimated(true);
					}
				}
			},
			{ threshold: 0.1 },
		);

		if (sectionRef.current) {
			observer.observe(sectionRef.current);
		}

		return () => observer.disconnect();
	}, []);

	return (
		<section
			ref={sectionRef}
			id="features"
			className="relative py-24 bg-gradient-to-b from-gray-100/50 via-white to-gray-50/50 dark:from-gray-800/50 dark:via-gray-900 dark:to-gray-800/50 overflow-hidden"
		>
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(4,77%,55%,0.03),transparent_60%)]" />

			<div className="container px-4 md:px-6 max-w-7xl mx-auto relative z-10">
				<div className="flex flex-col items-center justify-center space-y-4 text-center mb-14">
					<h2 className="text-3xl font-sans font-bold tracking-tighter sm:text-4xl md:text-5xl text-gray-900 dark:text-white">
						{t("features.title")}
					</h2>
					<p className="mx-auto max-w-[700px] font-sans text-gray-600 dark:text-gray-400 md:text-xl">
						{t("features.subtitle")}
					</p>
				</div>

				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{featureKeys.map((key, i) => {
						const Icon = featureIcons[key];
						return (
							<div
								key={key}
								className="group relative overflow-hidden rounded-xl border border-gray-200/50 bg-white/80 dark:border-gray-700/50 dark:bg-gray-800/80 backdrop-blur-sm p-8 shadow-sm hover:shadow-lg hover:border-gray-300/60 transition-all duration-500 h-full"
								style={{
									opacity: animated ? 1 : 0,
									transform: animated ? "translateY(0)" : "translateY(20px)",
									transition: `opacity 0.6s ease-out ${i * 0.1}s, transform 0.6s ease-out ${i * 0.1}s`,
								}}
							>
								<div className="flex flex-col gap-5">
									<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#e1393b]/10 text-[#e1393b] group-hover:bg-[#e1393b]/15 transition-colors duration-500">
										<Icon className="h-6 w-6" />
									</div>
									<div className="space-y-2">
										<h3 className="font-sans font-semibold text-lg text-gray-900 dark:text-white">
											{t(`features.${key}.title`)}
										</h3>
										<p className="font-sans text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
											{t(`features.${key}.description`)}
										</p>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
