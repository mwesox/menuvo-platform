import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Logo } from "@/components/ui/logo";

interface WelcomeSlideProps {
	onContinue: () => void;
}

export function WelcomeSlide({ onContinue }: WelcomeSlideProps) {
	const { t } = useTranslation("onboarding");

	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0, y: -20 }}
			className="flex min-h-dvh flex-col items-center justify-center px-6"
		>
			{/* Decorative ribbon - brand element */}
			<motion.div
				initial={{ scaleX: 0 }}
				animate={{ scaleX: 1 }}
				transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
				className="absolute top-0 left-0 h-1 w-full origin-left bg-gradient-to-r from-accent via-accent to-transparent"
			/>

			{/* Logo */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
				className="mb-10"
			>
				<Logo height={56} />
			</motion.div>

			{/* Greeting */}
			<motion.div
				initial={{ opacity: 0, y: 30 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.4, duration: 0.6 }}
				className="max-w-lg text-center"
			>
				<h1 className="font-body font-bold text-3xl text-foreground tracking-tight sm:text-4xl md:text-5xl">
					{t("slides.welcome.title")}
				</h1>

				<p className="mt-6 font-body text-lg text-muted-foreground leading-relaxed sm:text-xl">
					{t("slides.welcome.description")}{" "}
					<span className="font-medium text-foreground">
						{t("slides.welcome.duration")}
					</span>
				</p>
			</motion.div>

			{/* CTA */}
			<motion.button
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.6 }}
				whileHover={{ scale: 1.02 }}
				whileTap={{ scale: 0.98 }}
				onClick={onContinue}
				type="button"
				className="mt-14 rounded-lg bg-primary px-10 py-4 font-body font-semibold text-base text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
			>
				{t("slides.welcome.cta")}
			</motion.button>

			{/* Time indicator */}
			<motion.p
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 0.8 }}
				className="mt-6 font-body text-muted-foreground text-sm"
			>
				{t("slides.welcome.timeHint")}
			</motion.p>
		</motion.div>
	);
}
