import { CreditCard, ExternalLink, PlayCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	useCancelSubscription,
	useOpenBillingPortal,
	useResumeSubscription,
} from "../../queries";
import type { SubscriptionStatus } from "../../schemas";
import { CancelSubscriptionDialog } from "./cancel-subscription-dialog";

interface SubscriptionActionsProps {
	merchantId: number;
	subscription: {
		subscriptionStatus: SubscriptionStatus;
		subscriptionId: string | null;
		cancelAtPeriodEnd: boolean;
		paymentAccountId: string | null;
	};
}

export function SubscriptionActions({
	merchantId,
	subscription,
}: SubscriptionActionsProps) {
	const { t } = useTranslation("settings");
	const [showCancelDialog, setShowCancelDialog] = useState(false);

	const cancelMutation = useCancelSubscription();
	const resumeMutation = useResumeSubscription();
	const billingPortalMutation = useOpenBillingPortal();

	const canCancel =
		["active", "trialing"].includes(subscription.subscriptionStatus) &&
		!subscription.cancelAtPeriodEnd;
	const canResume = subscription.subscriptionStatus === "paused";
	const hasSubscription = subscription.subscriptionId !== null;
	const hasPaymentAccount = subscription.paymentAccountId !== null;

	const handleCancel = (immediately: boolean) => {
		cancelMutation.mutate({ merchantId, immediately });
		setShowCancelDialog(false);
	};

	const handleResume = () => {
		resumeMutation.mutate({ merchantId });
	};

	const handleBillingPortal = () => {
		billingPortalMutation.mutate({ merchantId });
	};

	// Don't show actions card if no subscription and no payment account
	if (!hasSubscription && !hasPaymentAccount) {
		return null;
	}

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>{t("subscription.actions.title")}</CardTitle>
					<CardDescription>
						{t("subscription.actions.description")}
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-wrap gap-3">
					{/* Billing Portal */}
					{hasPaymentAccount && (
						<Button
							variant="outline"
							onClick={handleBillingPortal}
							disabled={billingPortalMutation.isPending}
						>
							<CreditCard className="mr-2 h-4 w-4" />
							{t("subscription.actions.manageBilling")}
							<ExternalLink className="ml-2 h-3 w-3" />
						</Button>
					)}

					{/* Resume (for paused) */}
					{canResume && (
						<Button onClick={handleResume} disabled={resumeMutation.isPending}>
							<PlayCircle className="mr-2 h-4 w-4" />
							{resumeMutation.isPending
								? t("subscription.actions.resuming")
								: t("subscription.actions.resume")}
						</Button>
					)}

					{/* Cancel */}
					{canCancel && (
						<Button
							variant="destructive"
							onClick={() => setShowCancelDialog(true)}
						>
							<XCircle className="mr-2 h-4 w-4" />
							{t("subscription.actions.cancel")}
						</Button>
					)}
				</CardContent>
			</Card>

			<CancelSubscriptionDialog
				open={showCancelDialog}
				onOpenChange={setShowCancelDialog}
				onConfirm={handleCancel}
				isLoading={cancelMutation.isPending}
			/>
		</>
	);
}
