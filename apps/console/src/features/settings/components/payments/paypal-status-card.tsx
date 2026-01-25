import {
	Alert,
	Badge,
	Button,
	Card,
	HStack,
	Icon,
	VStack,
} from "@chakra-ui/react";
import type { AppRouter } from "@menuvo/api/trpc";
import { useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import {
	AlertTriangle,
	CheckCircle,
	Circle,
	Clock,
	ExternalLink,
	RefreshCw,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Caption, Label } from "@/components/ui/typography";
import { useTRPC } from "@/lib/trpc";

type RouterOutput = inferRouterOutputs<AppRouter>;
type PaymentAccountStatus = RouterOutput["payments"]["getAccountStatus"];

interface PayPalStatusCardProps {
	paymentStatus: PaymentAccountStatus;
}

/**
 * Shows PayPal payment account status after initial setup.
 * Displays onboarding progress and capabilities.
 */
export function PayPalStatusCard({ paymentStatus }: PayPalStatusCardProps) {
	const { t } = useTranslation("settings");
	const { t: tToasts } = useTranslation("toasts");
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const [isRefreshing, setIsRefreshing] = useState(false);

	const refreshStatus = useCallback(async () => {
		try {
			await queryClient.fetchQuery(
				trpc.payments.getOnboardingStatus.queryOptions(),
			);
			queryClient.invalidateQueries({
				queryKey: trpc.payments.getAccountStatus.queryKey(),
			});
			toast.success(tToasts("success.paymentStatusRefreshed"));
		} catch {
			toast.error(tToasts("error.refreshPaymentStatus"));
		}
	}, [queryClient, tToasts, trpc]);

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await refreshStatus();
		} finally {
			setIsRefreshing(false);
		}
	};

	const handleOpenDashboard = () => {
		// PayPal Business Dashboard URL
		window.open("https://www.paypal.com/businesswallet/", "_blank");
	};

	const isComplete = paymentStatus.onboardingStatus === "completed";
	const isInReview = paymentStatus.onboardingStatus === "in_review";
	const isPending = paymentStatus.onboardingStatus === "pending";

	return (
		<Card.Root>
			<Card.Header>
				<HStack justify="space-between" align="flex-start">
					<VStack gap="2" align="flex-start">
						<HStack gap="2">
							<Card.Title>{t("payments.paypal.status.title")}</Card.Title>
							{isComplete && (
								<Badge colorPalette="green">
									{t("payments.paypal.status.complete")}
								</Badge>
							)}
							{isInReview && (
								<Badge variant="outline" colorPalette="amber">
									{t("payments.paypal.status.inReview")}
								</Badge>
							)}
						</HStack>
						<Card.Description>
							{t("payments.paypal.status.description")}
						</Card.Description>
					</VStack>
					<Button
						variant="outline"
						size="sm"
						onClick={handleRefresh}
						disabled={isRefreshing}
					>
						<Icon
							as={RefreshCw}
							animation={isRefreshing ? "spin" : undefined}
							me="2"
							fontSize="md"
						/>
						{t("payments.actions.refresh")}
					</Button>
				</HStack>
			</Card.Header>
			<Card.Body>
				<VStack gap="4" align="stretch">
					{/* Status list */}
					<VStack gap="3" align="stretch">
						<StatusRow
							label={t("payments.paypal.status.account.label")}
							status={paymentStatus.merchantId ? "active" : "inactive"}
							activeText={t("payments.paypal.status.account.connected")}
							inactiveText={t("payments.paypal.status.account.notConnected")}
						/>
						<StatusRow
							label={t("payments.paypal.status.onboarding.label")}
							status={
								isComplete ? "active" : isInReview ? "pending" : "inactive"
							}
							activeText={t("payments.paypal.status.onboarding.complete")}
							pendingText={t("payments.paypal.status.onboarding.inReview")}
							inactiveText={t("payments.paypal.status.onboarding.pending")}
						/>
						<StatusRow
							label={t("payments.paypal.status.payments.label")}
							status={paymentStatus.canReceivePayments ? "active" : "pending"}
							activeText={t("payments.paypal.status.payments.enabled")}
							pendingText={t("payments.paypal.status.payments.pending")}
						/>
					</VStack>

					{/* PayPal enabled badge */}
					{isComplete && (
						<VStack gap="3" align="stretch">
							<HStack
								gap="2"
								rounded="lg"
								borderWidth="1px"
								borderColor="border.info"
								bg="bg.info"
								p="3"
							>
								<Icon as={CheckCircle} fontSize="md" color="fg.success" />
								<Label color="fg.info">
									{t("payments.paypal.status.paymentsEnabled")}
								</Label>
							</HStack>
							<Button variant="outline" onClick={handleOpenDashboard} w="full">
								<Icon as={ExternalLink} me="2" fontSize="md" />
								{t("payments.paypal.actions.manageDashboard")}
							</Button>
						</VStack>
					)}

					{/* In review notice */}
					{isInReview && (
						<Alert.Root status="info">
							<Alert.Indicator>
								<Icon as={Clock} fontSize="md" />
							</Alert.Indicator>
							<Alert.Content>
								<Alert.Title>
									{t("payments.paypal.alerts.inReview.title")}
								</Alert.Title>
								<Alert.Description>
									{t("payments.paypal.alerts.inReview.description")}
								</Alert.Description>
							</Alert.Content>
						</Alert.Root>
					)}

					{/* Pending warning with action button */}
					{isPending && (
						<VStack gap="3" align="stretch">
							<Alert.Root status="warning" variant="outline">
								<Alert.Indicator>
									<Icon as={AlertTriangle} fontSize="md" />
								</Alert.Indicator>
								<Alert.Content>
									<Alert.Title>
										{t("payments.paypal.alerts.pending.title")}
									</Alert.Title>
									<Alert.Description>
										{t("payments.paypal.alerts.pending.description")}
									</Alert.Description>
								</Alert.Content>
							</Alert.Root>
							<Button onClick={handleOpenDashboard} w="full">
								<Icon as={ExternalLink} me="2" fontSize="md" />
								{t("payments.paypal.actions.completeSetup")}
							</Button>
						</VStack>
					)}
				</VStack>
			</Card.Body>
		</Card.Root>
	);
}

interface StatusRowProps {
	label: string;
	status: "active" | "pending" | "inactive";
	activeText: string;
	pendingText?: string;
	inactiveText?: string;
}

function StatusRow({
	label,
	status,
	activeText,
	pendingText,
	inactiveText,
}: StatusRowProps) {
	const StatusIcon =
		status === "active" ? CheckCircle : status === "pending" ? Circle : Circle;

	const iconColor =
		status === "active"
			? "fg.success"
			: status === "pending"
				? "fg.warning"
				: "fg.muted";

	const text =
		status === "active"
			? activeText
			: status === "pending"
				? pendingText
				: inactiveText;

	return (
		<HStack
			justify="space-between"
			align="center"
			borderBottomWidth="1px"
			py="2"
			_last={{ borderBottomWidth: 0 }}
		>
			<Caption>{label}</Caption>
			<HStack gap="2">
				<Icon as={StatusIcon} fontSize="md" color={iconColor} />
				<Label>{text}</Label>
			</HStack>
		</HStack>
	);
}
