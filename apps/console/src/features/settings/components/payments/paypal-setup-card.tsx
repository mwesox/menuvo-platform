import { Button, Card, HStack, Icon, Text, VStack } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, CreditCard, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Label } from "@/components/ui/typography";
import { useTRPC, useTRPCClient } from "@/lib/trpc";

/**
 * Card shown when merchant hasn't set up PayPal payments yet.
 * Displays benefits and setup button that starts the PayPal onboarding flow.
 */
export function PayPalSetupCard() {
	const { t } = useTranslation("settings");
	const { t: tToasts } = useTranslation("toasts");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();

	const setupPayPal = useMutation({
		...trpc.payments.startOnboarding.mutationOptions(),
		mutationFn: () => trpcClient.payments.startOnboarding.mutate(),
		onSuccess: (data) => {
			queryClient.invalidateQueries({
				queryKey: trpc.payments.getAccountStatus.queryKey(),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.merchant.getCurrent.queryKey(),
			});

			// If we got an onboarding URL, open it in a new tab
			// so our app stays open during PayPal onboarding
			const result = data as { onboardingUrl?: string } | undefined;
			if (result && "onboardingUrl" in result && result.onboardingUrl) {
				window.open(result.onboardingUrl, "_blank");
				toast.success(tToasts("success.paypalOnboardingStarted"));
			} else {
				toast.success(tToasts("success.paypalAccountSetup"));
			}
		},
		onError: () => {
			toast.error(tToasts("error.setupPayPalAccount"));
		},
	});

	const handleSetup = () => {
		setupPayPal.mutate();
	};

	const benefits = [
		"payments.paypal.benefits.paypal",
		"payments.paypal.benefits.cards",
		"payments.paypal.benefits.payLater",
		"payments.paypal.benefits.fastPayout",
	] as const;

	return (
		<Card.Root borderStyle="dashed">
			<Card.Header textAlign="center">
				<HStack
					justify="center"
					mb="4"
					w="12"
					h="12"
					rounded="full"
					bg="colorPalette.subtle"
					colorPalette="blue"
				>
					<Icon as={CreditCard} fontSize="lg" />
				</HStack>
				<Card.Title>{t("payments.paypal.setup.title")}</Card.Title>
				<Card.Description maxW="md" mx="auto">
					{t("payments.paypal.setup.description")}
				</Card.Description>
			</Card.Header>
			<Card.Body>
				<VStack gap="6" align="stretch">
					<VStack gap="3" align="stretch">
						<Label textAlign="center">
							{t("payments.paypal.setup.benefitsTitle")}
						</Label>
						<VStack gap="2" align="stretch">
							{benefits.map((key) => (
								<HStack key={key} gap="2">
									<Icon
										as={Check}
										fontSize="md"
										flexShrink={0}
										color="fg.success"
									/>
									<Text textStyle="sm">{t(key)}</Text>
								</HStack>
							))}
						</VStack>
					</VStack>

					{/* PayPal badge highlight */}
					<HStack
						justify="center"
						gap="2"
						rounded="lg"
						borderWidth="1px"
						borderColor="border.info"
						bg="bg.info"
						p="3"
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="currentColor"
							aria-hidden="true"
							role="img"
							color="#003087"
						>
							<title>PayPal</title>
							<path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 1.994a.768.768 0 0 1 .757-.647h6.833c2.274 0 3.984.586 5.082 1.742.985 1.037 1.465 2.467 1.386 4.132-.026.551-.112 1.145-.263 1.778-.646 2.753-2.277 4.465-4.854 5.093-.626.153-1.309.23-2.032.23H9.857a.953.953 0 0 0-.941.804l-.846 5.326a.768.768 0 0 1-.757.647l-.237.038Z" />
						</svg>
						<Label color="fg.info">
							{t("payments.paypal.setup.trustedPayments")}
						</Label>
					</HStack>

					<Button
						onClick={handleSetup}
						disabled={setupPayPal.isPending}
						w="full"
						size="lg"
					>
						{setupPayPal.isPending ? (
							<>
								<Icon as={Loader2} animation="spin" me="2" fontSize="md" />
								{t("payments.paypal.setup.creating")}
							</>
						) : (
							t("payments.paypal.setup.button")
						)}
					</Button>
				</VStack>
			</Card.Body>
		</Card.Root>
	);
}
