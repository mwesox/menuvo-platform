import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { subscriptionQueries } from "../../queries";
import { SubscriptionActions } from "../merchant/subscription-actions";
import { SubscriptionPlanSelector } from "../merchant/subscription-plan-selector";
import { SubscriptionStatusCard } from "../merchant/subscription-status-card";

interface SubscriptionSettingsPageProps {
	merchantId: number;
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
			<Button variant="ghost" size="sm" className="-ml-2 mb-2" asChild>
				<Link to="/console/settings">
					<ArrowLeft className="mr-2 h-4 w-4" />
					{t("navigation.backToSettings")}
				</Link>
			</Button>

			<PageHeader
				title={t("hub.subscription.title")}
				description={t("hub.subscription.description")}
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
