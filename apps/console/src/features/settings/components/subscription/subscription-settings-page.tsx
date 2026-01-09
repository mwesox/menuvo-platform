import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { subscriptionQueries } from "../../queries";
import { SubscriptionActions } from "../merchant/subscription-actions";
import { SubscriptionPlanSelector } from "../merchant/subscription-plan-selector";
import { SubscriptionStatusCard } from "../merchant/subscription-status-card";

export function SubscriptionSettingsPage() {
	const { t } = useTranslation("settings");
	const { data: subscription } = useSuspenseQuery(subscriptionQueries.detail());

	return (
		<div className="space-y-6">
			<PageActionBar
				breadcrumbs={[
					{ label: t("hub.pageTitle"), href: "/settings" },
					{ label: t("hub.subscription.title") },
				]}
			/>

			<div className="space-y-6">
				{/* Current Status Card */}
				<SubscriptionStatusCard
					subscription={{
						subscriptionStatus: subscription.status,
						currentPlan: subscription.plan,
						subscriptionTrialEndsAt: subscription.trialEndsAt,
						subscriptionCurrentPeriodEnd: subscription.currentPeriodEnd,
						cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
					}}
				/>

				{/* Plan Selection (for upgrades/downgrades) */}
				<SubscriptionPlanSelector
					currentPlan={subscription.plan}
					subscriptionStatus={subscription.status}
				/>

				{/* Actions: Cancel, Resume, Billing Portal */}
				<SubscriptionActions
					subscription={{
						subscriptionStatus: subscription.status,
						subscriptionId: subscription.subscriptionId,
						cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
						paymentAccountId: null, // TODO: Get from payment status
					}}
				/>
			</div>
		</div>
	);
}
