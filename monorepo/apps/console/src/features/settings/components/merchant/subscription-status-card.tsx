import { AlertTriangle, Clock, PauseCircle, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@menuvo/ui/alert";
import { Badge } from "@menuvo/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@menuvo/ui/card";
import type { SubscriptionStatus } from "../../schemas";

interface SubscriptionStatusCardProps {
	subscription: {
		subscriptionStatus: SubscriptionStatus;
		currentPlan: string | null;
		subscriptionTrialEndsAt: Date | null;
		subscriptionCurrentPeriodEnd: Date | null;
		cancelAtPeriodEnd: boolean;
	};
}

export function SubscriptionStatusCard({
	subscription,
}: SubscriptionStatusCardProps) {
	const { t } = useTranslation("settings");
	const { t: tBusiness } = useTranslation("business");

	const statusConfig = getStatusConfig(subscription.subscriptionStatus);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					{t("subscription.currentPlan")}
					<Badge
						variant={statusConfig.variant}
						className={statusConfig.className}
					>
						{t(`subscription.status.${subscription.subscriptionStatus}`)}
					</Badge>
				</CardTitle>
				<CardDescription>
					{t("subscription.currentPlanDescription")}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Plan name and price */}
				{subscription.currentPlan && (
					<div className="flex items-baseline gap-2">
						<span className="font-bold text-2xl">
							{tBusiness(`pricing.${subscription.currentPlan}.name`)}
						</span>
						<span className="text-muted-foreground">
							{tBusiness(`pricing.${subscription.currentPlan}.price`)}
							{tBusiness(`pricing.${subscription.currentPlan}.period`)}
						</span>
					</div>
				)}

				{/* No subscription state */}
				{subscription.subscriptionStatus === "none" && (
					<div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
						{t("subscription.noSubscription")}
					</div>
				)}

				{/* Trial ending alert */}
				{subscription.subscriptionStatus === "trialing" &&
					subscription.subscriptionTrialEndsAt && (
						<Alert>
							<Clock className="size-4" />
							<AlertTitle>{t("subscription.trialEnding.title")}</AlertTitle>
							<AlertDescription>
								{t("subscription.trialEnding.description", {
									date: formatDate(subscription.subscriptionTrialEndsAt),
								})}
							</AlertDescription>
						</Alert>
					)}

				{/* Past due alert */}
				{subscription.subscriptionStatus === "past_due" && (
					<Alert variant="destructive">
						<AlertTriangle className="size-4" />
						<AlertTitle>{t("subscription.pastDue.title")}</AlertTitle>
						<AlertDescription>
							{t("subscription.pastDue.description")}
						</AlertDescription>
					</Alert>
				)}

				{/* Paused alert */}
				{subscription.subscriptionStatus === "paused" && (
					<Alert className="border-amber-500 bg-amber-50 text-amber-900">
						<PauseCircle className="size-4" />
						<AlertTitle>{t("subscription.paused.title")}</AlertTitle>
						<AlertDescription className="text-amber-800">
							{t("subscription.paused.description")}
						</AlertDescription>
					</Alert>
				)}

				{/* Cancellation scheduled alert */}
				{subscription.cancelAtPeriodEnd && (
					<Alert className="border-amber-500 bg-amber-50 text-amber-900">
						<XCircle className="size-4" />
						<AlertTitle>{t("subscription.canceling.title")}</AlertTitle>
						<AlertDescription className="text-amber-800">
							{t("subscription.canceling.description", {
								date: formatDate(subscription.subscriptionCurrentPeriodEnd),
							})}
						</AlertDescription>
					</Alert>
				)}

				{/* Period end info for active subscriptions */}
				{subscription.subscriptionCurrentPeriodEnd &&
					!subscription.cancelAtPeriodEnd &&
					subscription.subscriptionStatus === "active" && (
						<p className="text-muted-foreground text-sm">
							{t("subscription.renewsOn", {
								date: formatDate(subscription.subscriptionCurrentPeriodEnd),
							})}
						</p>
					)}
			</CardContent>
		</Card>
	);
}

function formatDate(date: Date | null): string {
	if (!date) return "";
	return new Intl.DateTimeFormat("default", {
		dateStyle: "long",
	}).format(new Date(date));
}

function getStatusConfig(status: SubscriptionStatus): {
	variant: "default" | "secondary" | "destructive" | "outline";
	className?: string;
} {
	const configs: Record<
		SubscriptionStatus,
		{
			variant: "default" | "secondary" | "destructive" | "outline";
			className?: string;
		}
	> = {
		none: { variant: "secondary" },
		trialing: {
			variant: "outline",
			className: "border-blue-500 text-blue-700",
		},
		active: {
			variant: "default",
			className: "bg-green-600 hover:bg-green-600",
		},
		paused: {
			variant: "outline",
			className: "border-amber-500 text-amber-700",
		},
		past_due: { variant: "destructive" },
		canceled: { variant: "secondary" },
	};
	return configs[status] || configs.none;
}
