import { Box, Flex } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Logo } from "@/components/ui/logo";
import { useTRPC, useTRPCClient } from "@/lib/trpc";
import { useOnboardingWizard } from "../hooks/use-onboarding-wizard";
import {
	AddressSlide,
	ContactSlide,
	LegalEntitySlide,
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
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const { t } = useTranslation("onboarding");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const onboardMutation = useMutation({
		...trpc.auth.onboard.mutationOptions(),
		// Transform form input to API schema (add defaults for timezone/currency)
		mutationFn: async (input: typeof wizard.data) => {
			return trpcClient.auth.onboard.mutate({
				merchant: input.merchant,
				store: {
					...input.store,
					timezone: "Europe/Berlin",
					currency: "EUR",
				},
				legalEntity: input.legalEntity,
			});
		},
		onSuccess: async () => {
			// Invalidate auth queries with correct tRPC query key
			// This ensures the dashboard sees the new merchant after navigation
			await queryClient.invalidateQueries({
				queryKey: trpc.auth.getMerchantOrNull.queryKey(),
			});

			toast.success(t("toast.successTitle"), {
				description: t("toast.successDescription"),
			});
			// Navigation handled by the caller (wizard) after this completes
		},
		onError: (error) => {
			toast.error(t("toast.errorTitle"), {
				description:
					error instanceof Error ? error.message : "An unknown error occurred",
			});
		},
	});

	// Handle final form submission
	const handleSubmit = async () => {
		setIsSubmitting(true);
		console.log("[onboarding-wizard] Starting submission...");

		try {
			const result = (await onboardMutation.mutateAsync(wizard.data)) as {
				merchant: { id: string };
				store: { id: string };
			};
			console.log("[onboarding-wizard] Mutation succeeded:", {
				merchantId: result.merchant.id,
				storeId: result.store.id,
			});

			// Check if cookie was set by browser
			console.log(
				"[onboarding-wizard] Cookies after mutation:",
				document.cookie,
			);

			// Invalidate auth query before navigating so dashboard fetches fresh data
			console.log("[onboarding-wizard] Invalidating auth queries...");
			await queryClient.invalidateQueries({
				queryKey: trpc.auth.getMerchantOrNull.queryKey(),
			});
			console.log(
				"[onboarding-wizard] Auth queries invalidated, navigating to /",
			);

			navigate({ to: "/" });
		} catch (error) {
			console.error("[onboarding-wizard] Onboarding failed:", error);
			toast.error(
				"Fehler beim Erstellen des Kontos. Bitte versuchen Sie es erneut.",
			);
			setIsSubmitting(false);
		}
	};

	return (
		<Flex minH="100dvh" direction="column" bg="bg">
			{/* Header with logo - in document flow, show on all slides except welcome */}
			{!wizard.isWelcome && (
				<Box
					as="header"
					flexShrink="0"
					display="flex"
					alignItems="center"
					justifyContent="center"
					py={{ base: "8", sm: "10" }}
				>
					<Logo height={56} />
				</Box>
			)}

			{/* Progress bar - only show after welcome and not during navigation */}
			{!wizard.isWelcome && !isSubmitting && (
				<ProgressBar
					current={wizard.currentSlide}
					total={wizard.totalSlides - 1} // -1 because we don't count review in progress
				/>
			)}

			{/* Slides container - flex-1 when header is shown */}
			<Box
				flex={wizard.isWelcome ? undefined : "1"}
				display={wizard.isWelcome ? undefined : "flex"}
				flexDirection={wizard.isWelcome ? undefined : "column"}
			>
				<AnimatePresence mode="wait" custom={wizard.direction}>
					{/* Slide 0: Welcome */}
					{wizard.currentSlide === 0 && (
						<WelcomeSlide key="welcome" onContinue={wizard.goToNext} />
					)}

					{/* Slide 1: Legal Entity (merged with business) */}
					{wizard.currentSlide === 1 && (
						<LegalEntitySlide
							key="legal-entity"
							questionNumber={1}
							totalQuestions={wizard.totalQuestions}
							direction={wizard.direction}
							defaultValues={wizard.data.legalEntity}
							onComplete={wizard.completeLegalEntitySlide}
							onBack={wizard.goToPrevious}
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
			</Box>
		</Flex>
	);
}
