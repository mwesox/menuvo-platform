import { useSuspenseQuery } from "@tanstack/react-query";
import { subscriptionQueries } from "../../queries";
import { SubscriptionActions } from "./subscription-actions";
import { SubscriptionPlanSelector } from "./subscription-plan-selector";
import { SubscriptionStatusCard } from "./subscription-status-card";

interface MerchantSubscriptionPanelProps {
	merchantId: number;
}

export function MerchantSubscriptionPanel({
	merchantId,
}: MerchantSubscriptionPanelProps) {
	const { data: subscription } = useSuspenseQuery(
		subscriptionQueries.detail(merchantId),
	);

	return (
		<div className="space-y-6">
			{/* Current Status Card */}
			<SubscriptionStatusCard subscription={subscription} />

			{/* Plan Selection (for upgrades/downgrades) */}
			<SubscriptionPlanSelector
				merchantId={merchantId}
				currentPlan={subscription.currentPlan}
				subscriptionStatus={subscription.subscriptionStatus}
			/>

			{/* Actions: Cancel, Resume, Billing Portal */}
			<SubscriptionActions
				merchantId={merchantId}
				subscription={subscription}
			/>
		</div>
	);
}
