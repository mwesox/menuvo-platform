import { Check, Sparkles, Zap } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useChangeSubscriptionPlan } from "../../queries";
import type { PlanTier, SubscriptionStatus } from "../../schemas";
import { getPriceIdForPlan } from "../../server/subscription.functions";
import { PlanChangeConfirmDialog } from "./plan-change-confirm-dialog";

interface SubscriptionPlanSelectorProps {
	merchantId: number;
	currentPlan: PlanTier | null;
	subscriptionStatus: SubscriptionStatus;
}

const plans: { id: PlanTier; icon: typeof Zap }[] = [
	{ id: "starter", icon: Zap },
	{ id: "professional", icon: Sparkles },
	{ id: "max", icon: Sparkles },
];

const planOrder: PlanTier[] = ["starter", "professional", "max"];

export function SubscriptionPlanSelector({
	merchantId: _merchantId, // Kept for interface compatibility, server gets from auth
	currentPlan,
	subscriptionStatus,
}: SubscriptionPlanSelectorProps) {
	const { t } = useTranslation("settings");
	const { t: tBusiness } = useTranslation("business");
	const [selectedPlan, setSelectedPlan] = useState<PlanTier | null>(null);
	const [showConfirm, setShowConfirm] = useState(false);
	const changePlanMutation = useChangeSubscriptionPlan();

	const canChangePlan = ["active", "trialing"].includes(subscriptionStatus);

	const handlePlanSelect = (planId: PlanTier) => {
		if (planId === currentPlan) return;
		setSelectedPlan(planId);
		setShowConfirm(true);
	};

	const handleConfirm = async () => {
		if (!selectedPlan) return;

		try {
			const { priceId } = await getPriceIdForPlan({
				data: { plan: selectedPlan },
			});

			changePlanMutation.mutate({
				priceId,
				newPlan: selectedPlan,
			});
		} catch {
			// Error handled by mutation
		}
	};

	const isUpgrade = (planId: PlanTier): boolean => {
		const currentIndex = planOrder.indexOf(currentPlan || "starter");
		const newIndex = planOrder.indexOf(planId);
		return newIndex > currentIndex;
	};

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>{t("subscription.changePlan.title")}</CardTitle>
					<CardDescription>
						{canChangePlan
							? t("subscription.changePlan.description")
							: t("subscription.changePlan.notAvailable")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-4 md:grid-cols-3">
						{plans.map((plan) => {
							const Icon = plan.icon;
							const isCurrent = plan.id === currentPlan;
							const features = tBusiness(`pricing.${plan.id}.features`, {
								returnObjects: true,
							}) as string[];

							return (
								<Card
									key={plan.id}
									className={cn(
										"relative cursor-pointer transition-colors hover:border-primary/50",
										isCurrent && "border-primary bg-primary/5",
										!canChangePlan && "cursor-not-allowed opacity-50",
									)}
									onClick={() =>
										canChangePlan && !isCurrent && handlePlanSelect(plan.id)
									}
								>
									<CardHeader className="pb-2">
										<div className="flex items-center justify-between">
											<Icon className="size-5 text-primary" />
											{isCurrent && (
												<Badge variant="secondary">
													{t("subscription.currentPlanBadge")}
												</Badge>
											)}
										</div>
										<CardTitle className="text-lg">
											{tBusiness(`pricing.${plan.id}.name`)}
										</CardTitle>
										<CardDescription>
											{tBusiness(`pricing.${plan.id}.description`)}
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="mb-4">
											<span className="font-bold text-3xl">
												{tBusiness(`pricing.${plan.id}.price`)}€
											</span>
											<span className="text-muted-foreground">
												{tBusiness(`pricing.${plan.id}.period`)}
											</span>
										</div>
										<ul className="space-y-2 text-sm">
											{features.slice(0, 4).map((feature) => (
												<li key={feature} className="flex items-center gap-2">
													<Check className="size-4 text-green-500" />
													<span className="line-clamp-1">{feature}</span>
												</li>
											))}
											{features.length > 4 && (
												<li className="text-muted-foreground text-xs">
													+{features.length - 4} more
												</li>
											)}
										</ul>
										{!isCurrent && canChangePlan && (
											<Button className="mt-4 w-full" variant="outline">
												{isUpgrade(plan.id)
													? t("subscription.upgrade")
													: t("subscription.downgrade")}
											</Button>
										)}
									</CardContent>
								</Card>
							);
						})}
					</div>
				</CardContent>
			</Card>

			<PlanChangeConfirmDialog
				open={showConfirm}
				onOpenChange={setShowConfirm}
				currentPlan={currentPlan}
				newPlan={selectedPlan}
				isUpgrade={selectedPlan ? isUpgrade(selectedPlan) : false}
				onConfirm={handleConfirm}
				isLoading={changePlanMutation.isPending}
			/>
		</>
	);
}
