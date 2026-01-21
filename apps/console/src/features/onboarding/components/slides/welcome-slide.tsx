import { Button, Heading, Text, VStack } from "@chakra-ui/react";
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
			style={{
				minHeight: "100dvh",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				paddingLeft: "1.5rem",
				paddingRight: "1.5rem",
			}}
		>
			{/* Logo */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.2 }}
				style={{ marginBottom: "2.5rem" }}
			>
				<Logo height={56} />
			</motion.div>

			{/* Greeting */}
			<motion.div
				initial={{ opacity: 0, y: 30 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.4, duration: 0.6 }}
				style={{ maxWidth: "32rem", textAlign: "center", width: "100%" }}
			>
				<VStack gap="6" align="stretch">
					<Heading
						as="h1"
						fontWeight="bold"
						textStyle={{ base: "3xl", sm: "4xl", md: "5xl" }}
						letterSpacing="tight"
					>
						{t("slides.welcome.title")}
					</Heading>

					<Text
						textStyle={{ base: "lg", sm: "xl" }}
						color="fg.muted"
						lineHeight="relaxed"
					>
						{t("slides.welcome.description")}
					</Text>
				</VStack>
			</motion.div>

			{/* CTA */}
			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.6 }}
				style={{ marginTop: "3.5rem" }}
			>
				<Button
					onClick={onContinue}
					type="button"
					size="lg"
					px="10"
					py="4"
					_hover={{ transform: "scale(1.02)" }}
					_active={{ transform: "scale(0.98)" }}
					transition="transform 0.2s"
				>
					{t("slides.welcome.cta")}
				</Button>
			</motion.div>
		</motion.div>
	);
}
