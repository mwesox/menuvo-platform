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
			className="relative overflow-hidden bg-gradient-to-b from-gray-100/50 via-white to-gray-50/50 py-24"
		>
			<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(4,77%,55%,0.03),transparent_60%)]" />

			<div className="container relative z-10 mx-auto max-w-7xl px-4 md:px-6">
				<div className="mb-14 flex flex-col items-center justify-center space-y-4 text-center">
					<h2 className="text-pretty font-bold text-3xl text-gray-900 tracking-tighter sm:text-4xl md:text-5xl">
						{t("features.title")}
					</h2>
					<p className="mx-auto max-w-[700px] text-gray-600 md:text-xl">
						{t("features.subtitle")}
					</p>
				</div>

				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{featureKeys.map((key, i) => {
						const Icon = featureIcons[key];
						return (
							<div
								key={key}
								className="group relative h-full overflow-hidden rounded-xl border border-gray-200/50 bg-white/80 p-8 shadow-sm backdrop-blur-sm transition-all duration-500 hover:border-gray-300/60 hover:shadow-lg"
								style={{
									opacity: animated ? 1 : 0,
									transform: animated ? "translateY(0)" : "translateY(20px)",
									transition: `opacity 0.6s ease-out ${i * 0.1}s, transform 0.6s ease-out ${i * 0.1}s`,
								}}
							>
								<div className="flex flex-col gap-5">
									<div className="flex size-12 items-center justify-center rounded-lg bg-brand-red/10 text-brand-red transition-colors duration-500 group-hover:bg-brand-red/15">
										<Icon className="size-6" />
									</div>
									<div className="space-y-2">
										<h3 className="font-semibold text-gray-900 text-lg">
											{t(`features.${key}.title`)}
										</h3>
										<p className="text-gray-600 text-sm leading-relaxed">
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
