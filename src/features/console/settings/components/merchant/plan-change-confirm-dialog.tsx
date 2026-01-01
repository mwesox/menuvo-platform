import { useTranslation } from "react-i18next";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PlanChangeConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	currentPlan: string | null;
	newPlan: string | null;
	isUpgrade: boolean;
	onConfirm: () => void;
	isLoading: boolean;
}

export function PlanChangeConfirmDialog({
	open,
	onOpenChange,
	currentPlan,
	newPlan,
	isUpgrade,
	onConfirm,
	isLoading,
}: PlanChangeConfirmDialogProps) {
	const { t } = useTranslation("settings");
	const { t: tBusiness } = useTranslation("business");

	const fromPlanName = currentPlan
		? tBusiness(`pricing.${currentPlan}.name`)
		: "";
	const toPlanName = newPlan ? tBusiness(`pricing.${newPlan}.name`) : "";

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{isUpgrade
							? t("subscription.confirm.upgradeTitle")
							: t("subscription.confirm.downgradeTitle")}
					</AlertDialogTitle>
					<AlertDialogDescription>
						{isUpgrade
							? t("subscription.confirm.upgradeDescription", {
									from: fromPlanName,
									to: toPlanName,
								})
							: t("subscription.confirm.downgradeDescription", {
									from: fromPlanName,
									to: toPlanName,
								})}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isLoading}>
						{t("common:buttons.cancel")}
					</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm} disabled={isLoading}>
						{isLoading
							? t("subscription.confirm.processing")
							: t("subscription.confirm.continue")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
