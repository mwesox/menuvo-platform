import {
	Button,
	Checkbox,
	Dialog,
	Field,
	HStack,
	IconButton,
	Input,
	Portal,
	Text,
	VStack,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Caption, Label } from "@/components/ui/typography";
import type { PaymentProvider } from "@/features/orders";
import { useTRPC, useTRPCClient } from "@/lib/trpc";

interface RefundButtonProps {
	orderId: string;
	storeId: string;
	totalAmount: number;
	paymentStatus: string;
	paymentProvider: PaymentProvider | null;
	/** If true, shows a compact icon-only button */
	compact?: boolean;
}

/**
 * Refund button for Mollie orders.
 *
 * Features:
 * - Only visible for Mollie orders with status "paid"
 * - Confirmation dialog before refund
 * - Optional partial refund amount input
 * - Disabled while refund is in progress
 */
export function RefundButton({
	orderId,
	storeId,
	totalAmount,
	paymentStatus,
	paymentProvider,
	compact = false,
}: RefundButtonProps) {
	const { t } = useTranslation("orders");
	const { t: tToasts } = useTranslation("toasts");
	const [isOpen, setIsOpen] = useState(false);
	const [partialAmount, setPartialAmount] = useState("");
	const [isPartialRefund, setIsPartialRefund] = useState(false);

	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();

	const refundMutation = useMutation({
		mutationKey: trpc.order.createRefund.mutationKey(),
		mutationFn: async (input: {
			orderId: string;
			amount?: number;
			description?: string;
		}) => {
			return trpcClient.order.createRefund.mutate({
				orderId: input.orderId,
				amount: input.amount,
				description: input.description,
			});
		},
		onSuccess: (result) => {
			// Invalidate order queries to refresh status
			queryClient.invalidateQueries({
				queryKey: trpc.order.getById.queryKey({ orderId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.order.listByStore.queryKey({ storeId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.order.listForKitchen.queryKey({ storeId, limit: 50 }),
			});

			// Show success message based on refund type
			if (result.isPartialRefund) {
				toast.success(tToasts("success.orderPartiallyRefunded"));
			} else {
				toast.success(tToasts("success.orderRefunded"));
			}
		},
		onError: (error: unknown) => {
			const message =
				error instanceof Error ? error.message : tToasts("error.createRefund");
			toast.error(message);
		},
	});

	// Only show for Mollie orders with status "paid"
	if (paymentProvider !== "mollie" || paymentStatus !== "paid") {
		return null;
	}

	const handleRefund = () => {
		let refundAmount: number | undefined;

		if (isPartialRefund && partialAmount) {
			// Convert to cents (input is in euros)
			refundAmount = Math.round(Number.parseFloat(partialAmount) * 100);

			if (Number.isNaN(refundAmount) || refundAmount <= 0) {
				return;
			}

			if (refundAmount > totalAmount) {
				refundAmount = totalAmount;
			}
		}

		refundMutation.mutate(
			{
				orderId,
				amount: refundAmount,
			},
			{
				onSuccess: () => {
					setIsOpen(false);
					setPartialAmount("");
					setIsPartialRefund(false);
				},
			},
		);
	};

	const formatAmount = (cents: number) => {
		return new Intl.NumberFormat("de-DE", {
			style: "currency",
			currency: "EUR",
		}).format(cents / 100);
	};

	return (
		<Dialog.Root
			open={isOpen}
			onOpenChange={(e) => setIsOpen(e.open)}
			role="alertdialog"
		>
			<Dialog.Trigger asChild>
				{compact ? (
					<IconButton
						variant="outline"
						size="sm"
						title={t("actions.refund")}
						aria-label={t("actions.refund")}
					>
						<RotateCcw style={{ height: "1rem", width: "1rem" }} />
					</IconButton>
				) : (
					<Button variant="outline" size="sm">
						<RotateCcw
							style={{ height: "1rem", width: "1rem", marginRight: "0.5rem" }}
						/>
						{t("actions.refund")}
					</Button>
				)}
			</Dialog.Trigger>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>{t("refund.dialogTitle")}</Dialog.Title>
							<Dialog.Description>
								{t("refund.dialogDescription")}
							</Dialog.Description>
						</Dialog.Header>

						<Dialog.Body>
							<VStack gap="4" py="4">
								{/* Order amount display */}
								<HStack
									justify="space-between"
									rounded="md"
									bg="bg.muted"
									px="3"
									py="2"
									w="full"
								>
									<Caption>{t("refund.orderTotal")}</Caption>
									<Label>{formatAmount(totalAmount)}</Label>
								</HStack>

								{/* Partial refund toggle */}
								<Checkbox.Root
									checked={isPartialRefund}
									onCheckedChange={(e) =>
										setIsPartialRefund(e.checked === true)
									}
								>
									<Checkbox.HiddenInput />
									<Checkbox.Control />
									<Checkbox.Label cursor="pointer" textStyle="sm">
										{t("refund.partialRefund")}
									</Checkbox.Label>
								</Checkbox.Root>

								{/* Partial amount input */}
								{isPartialRefund && (
									<VStack gap="2" align="stretch" w="full">
										<Field.Root>
											<Field.Label>
												{t("refund.amount")} ({t("refund.inEuros")})
											</Field.Label>
											<Input
												type="number"
												step="0.01"
												min="0.01"
												max={(totalAmount / 100).toFixed(2)}
												value={partialAmount}
												onChange={(e) => setPartialAmount(e.target.value)}
												placeholder={(totalAmount / 100).toFixed(2)}
											/>
										</Field.Root>
										<Text color="fg.muted" textStyle="xs">
											{t("refund.maxAmount")}: {formatAmount(totalAmount)}
										</Text>
									</VStack>
								)}
							</VStack>
						</Dialog.Body>

						<Dialog.Footer>
							<Button
								variant="outline"
								onClick={() => setIsOpen(false)}
								disabled={refundMutation.isPending}
							>
								{t("actions.cancel")}
							</Button>
							<Button
								colorPalette="red"
								onClick={(e) => {
									e.preventDefault();
									handleRefund();
								}}
								disabled={refundMutation.isPending}
							>
								{refundMutation.isPending ? (
									<HStack gap="2">
										<Loader2 style={{ height: "1rem", width: "1rem" }} />
										<Text>{t("refund.processing")}</Text>
									</HStack>
								) : isPartialRefund && partialAmount ? (
									t("refund.confirmPartial", {
										amount: formatAmount(
											Math.round(Number.parseFloat(partialAmount) * 100),
										),
									})
								) : (
									t("refund.confirmFull")
								)}
							</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
}
