/**
 * Dialog for canceling an order with optional reason.
 * Uses React 19's useActionState for form handling.
 */

import { useActionState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCancelOrder } from "@/features/orders/queries";

interface CancelOrderDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	orderId: number;
	storeId: number;
}

interface FormState {
	success: boolean;
	error?: string;
}

export function CancelOrderDialog({
	open,
	onOpenChange,
	orderId,
	storeId,
}: CancelOrderDialogProps) {
	const { t } = useTranslation("console-kitchen");
	const cancelMutation = useCancelOrder(storeId, orderId);

	const [state, formAction, isPending] = useActionState<FormState, FormData>(
		async (_prevState, formData) => {
			const reason = formData.get("reason") as string | null;

			try {
				await cancelMutation.mutateAsync({
					data: {
						orderId,
						reason: reason || undefined,
					},
				});

				// Hook handles cache invalidation and success toast
				onOpenChange(false);
				return { success: true };
			} catch (error) {
				// Hook handles error toast, but we still return error for form display
				const message =
					error instanceof Error ? error.message : t("errors.cancelFailed");
				return { success: false, error: message };
			}
		},
		{ success: false },
	);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("cancelDialog.title")}</DialogTitle>
					<DialogDescription>
						{t("cancelDialog.description", { orderId: `#${orderId}` })}
					</DialogDescription>
				</DialogHeader>

				<form action={formAction}>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="reason">{t("cancelDialog.reasonLabel")}</Label>
							<Textarea
								id="reason"
								name="reason"
								placeholder={t("cancelDialog.reasonPlaceholder")}
								className="min-h-[100px]"
							/>
							<p className="text-muted-foreground text-xs">
								{t("cancelDialog.reasonHint")}
							</p>
						</div>

						{state.error && (
							<p className="text-destructive text-sm">{state.error}</p>
						)}
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isPending}
						>
							{t("actions.keep")}
						</Button>
						<Button type="submit" variant="destructive" disabled={isPending}>
							{isPending ? t("actions.cancelling") : t("actions.confirmCancel")}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
