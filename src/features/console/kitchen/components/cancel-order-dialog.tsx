/**
 * Dialog for canceling an order with optional reason.
 * Uses React 19's useActionState for form handling.
 */

import { useQueryClient } from "@tanstack/react-query";
import { useActionState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
import { orderKeys } from "@/features/orders/queries";
import { cancelOrder } from "@/features/orders/server/orders.functions";

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
	const queryClient = useQueryClient();

	const [state, formAction, isPending] = useActionState<FormState, FormData>(
		async (_prevState, formData) => {
			const reason = formData.get("reason") as string | null;

			try {
				await cancelOrder({
					data: {
						orderId,
						reason: reason || undefined,
					},
				});

				// Invalidate queries
				queryClient.invalidateQueries({
					queryKey: orderKeys.kitchen(storeId),
				});
				queryClient.invalidateQueries({
					queryKey: orderKeys.kitchenDone(storeId),
				});
				queryClient.invalidateQueries({
					queryKey: orderKeys.detail(orderId),
				});

				toast.success(t("success.orderCancelled"));
				onOpenChange(false);
				return { success: true };
			} catch (error) {
				const message =
					error instanceof Error ? error.message : t("errors.cancelFailed");
				toast.error(message);
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
