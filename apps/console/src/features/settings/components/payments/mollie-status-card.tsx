import type { AppRouter } from "@menuvo/api/trpc";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@menuvo/ui";
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
			// The procedure returns info for API layer to get dashboard URL
			if (data && "dashboardUrl" in data && data.dashboardUrl) {
				window.open(data.dashboardUrl as string, "_blank");
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
		<Card>
			<CardHeader className="flex flex-row items-start justify-between">
				<div>
					<CardTitle className="flex items-center gap-2">
						{t("payments.mollie.status.title")}
						{isComplete && (
							<Badge className="bg-green-600 hover:bg-green-600">
								{t("payments.mollie.status.complete")}
							</Badge>
						)}
						{isInReview && (
							<Badge
								variant="outline"
								className="border-amber-500 text-amber-600"
							>
								{t("payments.mollie.status.inReview")}
							</Badge>
						)}
					</CardTitle>
					<CardDescription>
						{t("payments.mollie.status.description")}
					</CardDescription>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={handleRefresh}
					disabled={isRefreshing}
				>
					<RefreshCw
						className={`me-2 size-4 ${isRefreshing ? "animate-spin" : ""}`}
					/>
					{t("payments.actions.refresh")}
				</Button>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Status list */}
				<div className="space-y-3">
					<StatusRow
						label={t("payments.mollie.status.account.label")}
						status={mollieStatus.organizationId ? "active" : "inactive"}
						activeText={t("payments.mollie.status.account.connected")}
						inactiveText={t("payments.mollie.status.account.notConnected")}
					/>
					<StatusRow
						label={t("payments.mollie.status.onboarding.label")}
						status={isComplete ? "active" : isInReview ? "pending" : "inactive"}
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
				</div>

				{/* PayPal included badge */}
				{isComplete && (
					<div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
						<CheckCircle className="size-4 text-green-600" />
						<span className="font-medium text-blue-800 text-sm">
							{t("payments.mollie.status.paypalEnabled")}
						</span>
					</div>
				)}

				{/* In review notice */}
				{isInReview && (
					<Alert>
						<Clock className="size-4" />
						<AlertTitle>
							{t("payments.mollie.alerts.inReview.title")}
						</AlertTitle>
						<AlertDescription>
							{t("payments.mollie.alerts.inReview.description")}
						</AlertDescription>
					</Alert>
				)}

				{/* Needs data warning with action button */}
				{needsData && (
					<div className="space-y-3">
						<Alert className="border-amber-500 bg-amber-50 text-amber-900">
							<AlertTriangle className="size-4" />
							<AlertTitle>
								{t("payments.mollie.alerts.needsData.title")}
							</AlertTitle>
							<AlertDescription className="text-amber-800">
								{t("payments.mollie.alerts.needsData.description")}
							</AlertDescription>
						</Alert>
						<Button
							onClick={handleCompleteVerification}
							disabled={getDashboardUrl.isPending}
							className="w-full"
						>
							{getDashboardUrl.isPending ? (
								<RefreshCw className="me-2 size-4 animate-spin" />
							) : (
								<ExternalLink className="me-2 size-4" />
							)}
							{t("payments.mollie.actions.completeVerification")}
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
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
	const Icon =
		status === "active" ? CheckCircle : status === "pending" ? Circle : Circle;

	const iconColor =
		status === "active"
			? "text-green-600"
			: status === "pending"
				? "text-amber-500"
				: "text-muted-foreground";

	const text =
		status === "active"
			? activeText
			: status === "pending"
				? pendingText
				: inactiveText;

	return (
		<div className="flex items-center justify-between border-b py-2 last:border-0">
			<span className="text-muted-foreground text-sm">{label}</span>
			<div className="flex items-center gap-2">
				<Icon className={`size-4 ${iconColor}`} />
				<span className="font-medium text-sm">{text}</span>
			</div>
		</div>
	);
}
