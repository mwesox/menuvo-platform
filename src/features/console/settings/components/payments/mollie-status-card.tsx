import {
	AlertTriangle,
	CheckCircle,
	Circle,
	Clock,
	ExternalLink,
	RefreshCw,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { MollieOnboardingStatus } from "@/db/schema";
import {
	useGetMollieDashboardUrl,
	useRefreshMolliePaymentStatus,
} from "../../queries";

interface MollieStatusCardProps {
	mollieStatus: {
		mollieOrganizationId: string | null;
		mollieProfileId: string | null;
		mollieOnboardingStatus: MollieOnboardingStatus | null;
		mollieCanReceivePayments: boolean | null;
		mollieCanReceiveSettlements: boolean | null;
	};
	merchantId: number;
}

/**
 * Shows Mollie payment account status after initial setup.
 * Displays onboarding progress, capabilities, and PayPal badge.
 */
export function MollieStatusCard({
	mollieStatus,
	merchantId,
}: MollieStatusCardProps) {
	const { t } = useTranslation("settings");
	const refreshStatus = useRefreshMolliePaymentStatus();
	const getDashboardUrl = useGetMollieDashboardUrl();

	const handleRefresh = () => {
		refreshStatus.mutate({ merchantId });
	};

	const handleCompleteVerification = () => {
		getDashboardUrl.mutate();
	};

	const isComplete = mollieStatus.mollieOnboardingStatus === "completed";
	const isInReview = mollieStatus.mollieOnboardingStatus === "in-review";
	const needsData = mollieStatus.mollieOnboardingStatus === "needs-data";

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
					disabled={refreshStatus.isPending}
				>
					<RefreshCw
						className={`me-2 size-4 ${refreshStatus.isPending ? "animate-spin" : ""}`}
					/>
					{t("payments.actions.refresh")}
				</Button>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Status list */}
				<div className="space-y-3">
					<StatusRow
						label={t("payments.mollie.status.account.label")}
						status={mollieStatus.mollieOrganizationId ? "active" : "inactive"}
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
						status={
							mollieStatus.mollieCanReceivePayments ? "active" : "pending"
						}
						activeText={t("payments.mollie.status.payments.enabled")}
						pendingText={t("payments.mollie.status.payments.pending")}
					/>
					<StatusRow
						label={t("payments.mollie.status.settlements.label")}
						status={
							mollieStatus.mollieCanReceiveSettlements ? "active" : "pending"
						}
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
