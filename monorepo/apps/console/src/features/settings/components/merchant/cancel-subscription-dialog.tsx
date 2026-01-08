import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@menuvo/ui/alert-dialog";
import { Button } from "@menuvo/ui/button";
import { Checkbox } from "@menuvo/ui/checkbox";
import { Label } from "@menuvo/ui/label";

interface CancelSubscriptionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (immediately: boolean) => void;
	isLoading: boolean;
}

export function CancelSubscriptionDialog({
	open,
	onOpenChange,
	onConfirm,
	isLoading,
}: CancelSubscriptionDialogProps) {
	const { t } = useTranslation("settings");
	const [immediately, setImmediately] = useState(false);

	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			setImmediately(false);
		}
		onOpenChange(newOpen);
	};

	return (
		<AlertDialog open={open} onOpenChange={handleOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("subscription.cancel.title")}</AlertDialogTitle>
					<AlertDialogDescription>
						{t("subscription.cancel.description")}
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="flex items-center space-x-2 py-4">
					<Checkbox
						id="immediately"
						checked={immediately}
						onCheckedChange={(checked) => setImmediately(checked === true)}
					/>
					<Label htmlFor="immediately" className="text-sm">
						{t("subscription.cancel.immediately")}
					</Label>
				</div>

				{immediately && (
					<p className="text-destructive text-sm">
						{t("subscription.cancel.immediatelyWarning")}
					</p>
				)}

				<AlertDialogFooter>
					<AlertDialogCancel disabled={isLoading}>
						{t("common:buttons.cancel")}
					</AlertDialogCancel>
					<Button
						variant="destructive"
						onClick={() => onConfirm(immediately)}
						disabled={isLoading}
					>
						{isLoading
							? t("subscription.cancel.canceling")
							: t("subscription.cancel.confirm")}
					</Button>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
