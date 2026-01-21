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
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useTRPC, useTRPCClient } from "@/lib/trpc";

type RouterOutput = inferRouterOutputs<AppRouter>;
type MollieStatus = RouterOutput["payments"]["getMollieStatus"];

interface MollieStatusCardProps {
	mollieStatus: MollieStatus;
}

/**
 * Shows Mollie payment account status after initial setup.
 * Displays onboarding progress, capabilities, and PayPal badge.
 */
export function MollieStatusCard({ mollieStatus }: MollieStatusCardProps) {
	const { t } = useTranslation("settings");
	const { t: tToasts } = useTranslation("toasts");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const [isRefreshing, setIsRefreshing] = useState(false);

	const refreshStatus = useCallback(async () => {
		try {
			await queryClient.fetchQuery(
				trpc.payments.getOnboardingStatus.queryOptions(),
			);
			queryClient.invalidateQueries({
				queryKey: trpc.payments.getMollieStatus.queryKey(),
			});
			toast.success(tToasts("success.paymentStatusRefreshed"));
		} catch {
			toast.error(tToasts("error.refreshPaymentStatus"));
		}
	}, [queryClient, tToasts, trpc]);

	const getDashboardUrl = useMutation({
		mutationKey: ["payments", "getMollieDashboardUrl"],
		mutationFn: async () => {
			const result = (await trpcClient.payments.getDashboardUrl.query()) as {
				dashboardUrl?: string;
			};
			return result;
		},
		onSuccess: (data) => {
			if (data?.dashboardUrl) {
				window.open(data.dashboardUrl, "_blank");
			} else {
				// Dashboard URL unavailable (token expired or invalid)
				toast.error(tToasts("error.getMollieDashboardUrl"));
			}
		},
		onError: () => {
			toast.error(tToasts("error.getMollieDashboardUrl"));
		},
	});

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await refreshStatus();
		} finally {
			setIsRefreshing(false);
		}
	};

	const handleCompleteVerification = () => {
		getDashboardUrl.mutate();
	};

	const isComplete = mollieStatus.onboardingStatus === "completed";
	const isInReview = mollieStatus.onboardingStatus === "in-review";
	const needsData = mollieStatus.onboardingStatus === "needs-data";

	return (
		<Card.Root>
			<Card.Header>
				<HStack justify="space-between" align="flex-start">
					<VStack gap="2" align="flex-start">
						<HStack gap="2">
							<Card.Title>{t("payments.mollie.status.title")}</Card.Title>
							{isComplete && (
								<Badge colorPalette="green">
									{t("payments.mollie.status.complete")}
								</Badge>
							)}
							{isInReview && (
								<Badge variant="outline" colorPalette="amber">
									{t("payments.mollie.status.inReview")}
								</Badge>
							)}
						</HStack>
						<Card.Description>
							{t("payments.mollie.status.description")}
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
							label={t("payments.mollie.status.account.label")}
							status={mollieStatus.organizationId ? "active" : "inactive"}
							activeText={t("payments.mollie.status.account.connected")}
							inactiveText={t("payments.mollie.status.account.notConnected")}
						/>
						<StatusRow
							label={t("payments.mollie.status.onboarding.label")}
							status={
								isComplete ? "active" : isInReview ? "pending" : "inactive"
							}
							activeText={t("payments.mollie.status.onboarding.complete")}
							pendingText={t("payments.mollie.status.onboarding.inReview")}
							inactiveText={t("payments.mollie.status.onboarding.needsData")}
						/>
						<StatusRow
							label={t("payments.mollie.status.payments.label")}
							status={mollieStatus.canReceivePayments ? "active" : "pending"}
							activeText={t("payments.mollie.status.payments.enabled")}
							pendingText={t("payments.mollie.status.payments.pending")}
						/>
						<StatusRow
							label={t("payments.mollie.status.settlements.label")}
							status={mollieStatus.canReceiveSettlements ? "active" : "pending"}
							activeText={t("payments.mollie.status.settlements.enabled")}
							pendingText={t("payments.mollie.status.settlements.pending")}
						/>
					</VStack>

					{/* PayPal included badge */}
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
									{t("payments.mollie.status.paypalEnabled")}
								</Label>
							</HStack>
							<Button
								variant="outline"
								onClick={handleCompleteVerification}
								disabled={getDashboardUrl.isPending}
								w="full"
							>
								{getDashboardUrl.isPending ? (
									<Icon as={RefreshCw} animation="spin" me="2" fontSize="md" />
								) : (
									<Icon as={ExternalLink} me="2" fontSize="md" />
								)}
								{t("payments.mollie.actions.manageDashboard")}
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
									{t("payments.mollie.alerts.inReview.title")}
								</Alert.Title>
								<Alert.Description>
									{t("payments.mollie.alerts.inReview.description")}
								</Alert.Description>
							</Alert.Content>
						</Alert.Root>
					)}

					{/* Needs data warning with action button */}
					{needsData && (
						<VStack gap="3" align="stretch">
							<Alert.Root status="warning" variant="outline">
								<Alert.Indicator>
									<Icon as={AlertTriangle} fontSize="md" />
								</Alert.Indicator>
								<Alert.Content>
									<Alert.Title>
										{t("payments.mollie.alerts.needsData.title")}
									</Alert.Title>
									<Alert.Description>
										{t("payments.mollie.alerts.needsData.description")}
									</Alert.Description>
								</Alert.Content>
							</Alert.Root>
							<Button
								onClick={handleCompleteVerification}
								disabled={getDashboardUrl.isPending}
								w="full"
							>
								{getDashboardUrl.isPending ? (
									<Icon as={RefreshCw} animation="spin" me="2" fontSize="md" />
								) : (
									<Icon as={ExternalLink} me="2" fontSize="md" />
								)}
								{t("payments.mollie.actions.completeVerification")}
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
