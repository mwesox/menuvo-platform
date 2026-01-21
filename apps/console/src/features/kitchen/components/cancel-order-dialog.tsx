/**
 * Dialog for canceling an order with optional reason.
 * Uses React 19's useActionState for form handling.
 */

import {
	Button,
	Dialog,
	Field,
	Portal,
	Text,
	Textarea,
	VStack,
} from "@chakra-ui/react";
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
		<Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>{t("cancelDialog.title")}</Dialog.Title>
							<Dialog.Description>
								{t("cancelDialog.description", { orderId: `#${orderId}` })}
							</Dialog.Description>
						</Dialog.Header>

						<form action={formAction}>
							<Dialog.Body>
								<VStack gap="4" py="4">
									<Field.Root>
										<Field.Label htmlFor="reason">
											{t("cancelDialog.reasonLabel")}
										</Field.Label>
										<Textarea
											id="reason"
											name="reason"
											placeholder={t("cancelDialog.reasonPlaceholder")}
											minH="100px"
										/>
										<Text color="fg.muted" textStyle="xs">
											{t("cancelDialog.reasonHint")}
										</Text>
									</Field.Root>

									{state.error && (
										<Text color="fg.error" textStyle="sm">
											{state.error}
										</Text>
									)}
								</VStack>
							</Dialog.Body>

							<Dialog.Footer>
								<Button
									type="button"
									variant="outline"
									onClick={() => onOpenChange(false)}
									disabled={isPending}
								>
									{t("actions.keep")}
								</Button>
								<Button
									type="submit"
									colorPalette="red"
									disabled={isPending}
									loading={isPending}
									loadingText={t("actions.cancelling")}
								>
									{t("actions.confirmCancel")}
								</Button>
							</Dialog.Footer>
						</form>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
}
