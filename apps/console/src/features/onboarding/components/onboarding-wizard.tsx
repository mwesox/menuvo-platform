import { Logo } from "@menuvo/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useOnboardingWizard } from "../hooks/use-onboarding-wizard";
import { useOnboardMerchant } from "../queries";
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
	const queryClient = useQueryClient();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const onboardMutation = useOnboardMerchant();

	// Handle final form submission
	const handleSubmit = async () => {
		setIsSubmitting(true);
		try {
			await onboardMutation.mutateAsync({
				merchant: wizard.data.merchant,
				store: wizard.data.store,
			});

			// Invalidate auth queries to refresh merchant state
			// This ensures the dashboard will see the new merchant after navigation
			await queryClient.invalidateQueries({
				queryKey: ["auth"],
			});

			// Navigate to console on success
			navigate({ to: "/" });
		} catch (error) {
			console.error("Onboarding failed:", error);
			toast.error(
				"Fehler beim Erstellen des Kontos. Bitte versuchen Sie es erneut.",
			);
			setIsSubmitting(false);
		}
	};

	return (
		<div className="flex min-h-dvh flex-col bg-background">
			{/* Header with logo - in document flow, show on all slides except welcome */}
			{!wizard.isWelcome && (
				<header className="flex shrink-0 items-center justify-center py-8 sm:py-10">
					<Logo height={56} />
				</header>
			)}

			{/* Progress bar - only show after welcome and not during navigation */}
			{!wizard.isWelcome && !isSubmitting && (
				<ProgressBar
					current={wizard.currentSlide}
					total={wizard.totalSlides - 1} // -1 because we don't count review in progress
				/>
			)}

			{/* Slides container - flex-1 when header is shown */}
			<div className={wizard.isWelcome ? "" : "flex flex-1 flex-col"}>
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
		</div>
	);
}
