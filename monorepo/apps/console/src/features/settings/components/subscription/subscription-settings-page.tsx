import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { subscriptionQueries } from "../../queries";
import { SubscriptionActions } from "../merchant/subscription-actions";
import { SubscriptionPlanSelector } from "../merchant/subscription-plan-selector";
import { SubscriptionStatusCard } from "../merchant/subscription-status-card";

interface SubscriptionSettingsPageProps {
	merchantId: string;
}

export function SubscriptionSettingsPage({
	merchantId,
}: SubscriptionSettingsPageProps) {
	const { t } = useTranslation("settings");
	const { data: subscription } = useSuspenseQuery(
		subscriptionQueries.detail(merchantId),
	);

	return (
		<div className="space-y-6">
			<PageActionBar
				backHref="/settings"
				backLabel={t("navigation.backToSettings")}
			/>

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
		</div>
	);
}
