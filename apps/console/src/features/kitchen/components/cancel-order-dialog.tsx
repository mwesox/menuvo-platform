/**
 * Dialog for canceling an order with optional reason.
 * Uses React 19's useActionState for form handling.
 */

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Label,
	Textarea,
} from "@menuvo/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActionState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useTRPC, useTRPCClient } from "@/lib/trpc";

interface CancelOrderDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	orderId: string;
	storeId: string;
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
	const { t: tToasts } = useTranslation("toasts");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();

	const cancelMutation = useMutation({
		mutationKey: trpc.order.cancel.mutationKey(),
		mutationFn: async (input: { orderId: string; reason?: string }) => {
			return trpcClient.order.cancel.mutate({
				orderId: input.orderId,
				reason: input.reason,
			});
		},
		onSuccess: () => {
			// Invalidate order queries to refresh status
			queryClient.invalidateQueries({
				queryKey: trpc.order.listByStore.queryKey({ storeId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.order.listForKitchen.queryKey({ storeId, limit: 50 }),
			});

			toast.success(tToasts("success.orderCancelled"));
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error ? error.message : tToasts("error.cancelOrder");
			toast.error(message);
		},
	});

	const [state, formAction, isPending] = useActionState<FormState, FormData>(
		async (_prevState, formData) => {
			const reason = formData.get("reason") as string | null;

			try {
				await cancelMutation.mutateAsync({
					orderId,
					reason: reason || undefined,
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
