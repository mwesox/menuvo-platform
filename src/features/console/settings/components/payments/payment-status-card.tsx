import {
	AlertTriangle,
	CheckCircle,
	Circle,
	Clock,
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
import { useRefreshPaymentStatus } from "../../queries";

interface PaymentStatusCardProps {
	paymentStatus: {
		paymentAccountId: string | null;
		paymentOnboardingComplete: boolean | null;
		paymentCapabilitiesStatus: string | null;
		paymentRequirementsStatus: string | null;
		subscriptionStatus: string | null;
		subscriptionTrialEndsAt: Date | null;
	};
	merchantId: number;
}

export function PaymentStatusCard({
	paymentStatus,
	merchantId,
}: PaymentStatusCardProps) {
	const { t } = useTranslation("settings");
	const refreshStatus = useRefreshPaymentStatus();

	const handleRefresh = () => {
		refreshStatus.mutate({ merchantId });
	};

	const isTrialing = paymentStatus.subscriptionStatus === "trialing";
	const trialDaysRemaining = paymentStatus.subscriptionTrialEndsAt
		? Math.max(
				0,
				Math.ceil(
					(new Date(paymentStatus.subscriptionTrialEndsAt).getTime() -
						Date.now()) /
						(1000 * 60 * 60 * 24),
				),
			)
		: 0;

	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between">
				<div>
					<CardTitle className="flex items-center gap-2">
						{t("payments.status.title")}
						{paymentStatus.paymentOnboardingComplete && (
							<Badge className="bg-green-600 hover:bg-green-600">
								{t("payments.status.complete")}
							</Badge>
						)}
					</CardTitle>
					<CardDescription>{t("payments.status.description")}</CardDescription>
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
						label={t("payments.status.account.label")}
						status={paymentStatus.paymentAccountId ? "active" : "inactive"}
						activeText={t("payments.status.account.connected")}
						inactiveText={t("payments.status.account.notConnected")}
					/>
					<StatusRow
						label={t("payments.status.onboarding.label")}
						status={
							paymentStatus.paymentOnboardingComplete ? "active" : "pending"
						}
						activeText={t("payments.status.onboarding.complete")}
						pendingText={t("payments.status.onboarding.incomplete")}
					/>
					<StatusRow
						label={t("payments.status.capabilities.label")}
						status={
							paymentStatus.paymentCapabilitiesStatus as
								| "active"
								| "pending"
								| "inactive"
						}
						activeText={t("payments.status.capabilities.active")}
						pendingText={t("payments.status.capabilities.pending")}
						inactiveText={t("payments.status.capabilities.inactive")}
					/>
				</div>

				{/* Trial info */}
				{isTrialing && trialDaysRemaining > 0 && (
					<Alert>
						<Clock className="size-4" />
						<AlertTitle>{t("payments.trial.title")}</AlertTitle>
						<AlertDescription>
							{t("payments.trial.daysRemaining", { days: trialDaysRemaining })}
						</AlertDescription>
					</Alert>
				)}

				{/* Requirements warning */}
				{paymentStatus.paymentRequirementsStatus === "past_due" && (
					<Alert variant="destructive">
						<AlertTriangle className="size-4" />
						<AlertTitle>
							{t("payments.alerts.requirementsPastDue.title")}
						</AlertTitle>
						<AlertDescription>
							{t("payments.alerts.requirementsPastDue.description")}
						</AlertDescription>
					</Alert>
				)}

				{paymentStatus.paymentRequirementsStatus === "currently_due" && (
					<Alert className="border-amber-500 bg-amber-50 text-amber-900">
						<AlertTriangle className="size-4" />
						<AlertTitle>
							{t("payments.alerts.requirementsDue.title")}
						</AlertTitle>
						<AlertDescription className="text-amber-800">
							{t("payments.alerts.requirementsDue.description")}
						</AlertDescription>
					</Alert>
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
