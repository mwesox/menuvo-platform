import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/ui/logo";
import { config } from "@/config";
import { useOnboardingWizard } from "../hooks/use-onboarding-wizard";
import { onboardMerchant } from "../server/onboarding.functions";
import {
	AddressSlide,
	BusinessSlide,
	ContactSlide,
	OwnerSlide,
	ProgressBar,
	ReviewSlide,
	StoreNameSlide,
	WelcomeSlide,
} from "./slides";

export function OnboardingWizard() {
	const wizard = useOnboardingWizard();
	const navigate = useNavigate();
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Handle final form submission
	const handleSubmit = async () => {
		setIsSubmitting(true);
		try {
			await onboardMerchant({
				data: {
					merchant: wizard.data.merchant,
					store: {
						...wizard.data.store,
						timezone: config.defaultTimezone,
						currency: config.defaultCurrency,
					},
				},
			});

			// Navigate to console on success
			navigate({ to: "/console" });
		} catch (error) {
			console.error("Onboarding failed:", error);
			toast.error(
				"Fehler beim Erstellen des Kontos. Bitte versuchen Sie es erneut.",
			);
			setIsSubmitting(false);
		}
	};

	return (
		<div className="relative min-h-dvh bg-background">
			{/* Fixed header with logo - show on all slides except welcome */}
			{!wizard.isWelcome && (
				<header className="fixed top-0 right-0 left-0 z-10 flex items-center justify-center py-8 sm:py-10">
					<Logo height={56} />
				</header>
			)}

			{/* Progress bar - only show after welcome */}
			{!wizard.isWelcome && (
				<ProgressBar
					current={wizard.currentSlide}
					total={wizard.totalSlides - 1} // -1 because we don't count review in progress
				/>
			)}

			<AnimatePresence mode="wait" custom={wizard.direction}>
				{/* Slide 0: Welcome */}
				{wizard.currentSlide === 0 && (
					<WelcomeSlide key="welcome" onContinue={wizard.goToNext} />
				)}

				{/* Slide 1: Business Name */}
				{wizard.currentSlide === 1 && (
					<BusinessSlide
						key="business"
						questionNumber={1}
						totalQuestions={wizard.totalQuestions}
						direction={wizard.direction}
						defaultValue={wizard.data.merchant.name}
						onComplete={wizard.completeBusinessSlide}
					/>
				)}

				{/* Slide 2: Owner Name */}
				{wizard.currentSlide === 2 && (
					<OwnerSlide
						key="owner"
						questionNumber={2}
						totalQuestions={wizard.totalQuestions}
						direction={wizard.direction}
						defaultValue={wizard.data.merchant.ownerName}
						onComplete={wizard.completeOwnerSlide}
						onBack={wizard.goToPrevious}
					/>
				)}

				{/* Slide 3: Contact (Email + Phone) */}
				{wizard.currentSlide === 3 && (
					<ContactSlide
						key="contact"
						questionNumber={3}
						totalQuestions={wizard.totalQuestions}
						direction={wizard.direction}
						defaultValues={{
							email: wizard.data.merchant.email,
							phone: wizard.data.merchant.phone,
						}}
						onComplete={wizard.completeContactSlide}
						onBack={wizard.goToPrevious}
					/>
				)}

				{/* Slide 4: Store Name */}
				{wizard.currentSlide === 4 && (
					<StoreNameSlide
						key="store"
						questionNumber={4}
						totalQuestions={wizard.totalQuestions}
						direction={wizard.direction}
						defaultValue={wizard.data.store.name}
						onComplete={wizard.completeStoreNameSlide}
						onBack={wizard.goToPrevious}
					/>
				)}

				{/* Slide 5: Address */}
				{wizard.currentSlide === 5 && (
					<AddressSlide
						key="address"
						questionNumber={5}
						totalQuestions={wizard.totalQuestions}
						direction={wizard.direction}
						defaultValues={{
							street: wizard.data.store.street,
							city: wizard.data.store.city,
							postalCode: wizard.data.store.postalCode,
						}}
						onComplete={wizard.completeAddressSlide}
						onBack={wizard.goToPrevious}
					/>
				)}

				{/* Slide 6: Review */}
				{wizard.currentSlide === 6 && (
					<ReviewSlide
						key="review"
						direction={wizard.direction}
						data={wizard.data}
						onEdit={wizard.goToSlide}
						onSubmit={handleSubmit}
						isSubmitting={isSubmitting}
					/>
				)}
			</AnimatePresence>
		</div>
	);
}
