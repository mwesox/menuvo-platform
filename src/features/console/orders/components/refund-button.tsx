import { Loader2, RotateCcw } from "lucide-react";
import { useState } from "react";
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
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PaymentProvider } from "@/db/schema";
import { useCreateMollieRefund } from "../queries";

interface RefundButtonProps {
	orderId: number;
	storeId: number;
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
	const [isOpen, setIsOpen] = useState(false);
	const [partialAmount, setPartialAmount] = useState("");
	const [isPartialRefund, setIsPartialRefund] = useState(false);

	const refundMutation = useCreateMollieRefund(storeId, orderId);

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
		<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
			<AlertDialogTrigger asChild>
				{compact ? (
					<Button variant="outline" size="icon" title={t("actions.refund")}>
						<RotateCcw className="size-4" />
					</Button>
				) : (
					<Button variant="outline" size="sm">
						<RotateCcw className="me-2 size-4" />
						{t("actions.refund")}
					</Button>
				)}
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("refund.dialogTitle")}</AlertDialogTitle>
					<AlertDialogDescription>
						{t("refund.dialogDescription")}
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="space-y-4 py-4">
					{/* Order amount display */}
					<div className="flex items-center justify-between rounded-md bg-muted px-3 py-2">
						<span className="text-muted-foreground text-sm">
							{t("refund.orderTotal")}
						</span>
						<span className="font-medium">{formatAmount(totalAmount)}</span>
					</div>

					{/* Partial refund toggle */}
					<div className="flex items-center space-x-2">
						<input
							type="checkbox"
							id="partial-refund"
							checked={isPartialRefund}
							onChange={(e) => setIsPartialRefund(e.target.checked)}
							className="size-4"
						/>
						<Label htmlFor="partial-refund" className="cursor-pointer text-sm">
							{t("refund.partialRefund")}
						</Label>
					</div>

					{/* Partial amount input */}
					{isPartialRefund && (
						<div className="space-y-2">
							<Label htmlFor="refund-amount">
								{t("refund.amount")} ({t("refund.inEuros")})
							</Label>
							<Input
								id="refund-amount"
								type="number"
								step="0.01"
								min="0.01"
								max={(totalAmount / 100).toFixed(2)}
								value={partialAmount}
								onChange={(e) => setPartialAmount(e.target.value)}
								placeholder={(totalAmount / 100).toFixed(2)}
							/>
							<p className="text-muted-foreground text-xs">
								{t("refund.maxAmount")}: {formatAmount(totalAmount)}
							</p>
						</div>
					)}
				</div>

				<AlertDialogFooter>
					<AlertDialogCancel disabled={refundMutation.isPending}>
						{t("actions.cancel")}
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={(e) => {
							e.preventDefault();
							handleRefund();
						}}
						disabled={refundMutation.isPending}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{refundMutation.isPending ? (
							<>
								<Loader2 className="me-2 size-4 animate-spin" />
								{t("refund.processing")}
							</>
						) : isPartialRefund && partialAmount ? (
							t("refund.confirmPartial", {
								amount: formatAmount(
									Math.round(Number.parseFloat(partialAmount) * 100),
								),
							})
						) : (
							t("refund.confirmFull")
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
