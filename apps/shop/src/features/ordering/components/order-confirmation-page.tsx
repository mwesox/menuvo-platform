import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CheckCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTRPC } from "../../../lib/trpc";
import {
	ShopButton,
	ShopCard,
	ShopHeading,
	ShopMutedText,
} from "../../shared/components/ui";

interface OrderConfirmationPageProps {
	orderId: string;
	storeSlug: string;
}

export function OrderConfirmationPage({
	orderId,
	storeSlug,
}: OrderConfirmationPageProps) {
	const { t } = useTranslation("shop");
	const trpc = useTRPC();

	// Fetch order to get pickup number
	const { data: order, isLoading } = useQuery({
		...trpc.order.getById.queryOptions({ orderId }),
		staleTime: 30_000,
		refetchInterval: 15_000,
	});

	// Format pickup number with leading zeros
	const pickupNumber = order?.pickupNumber ?? 0;
	const formattedPickupNumber = String(pickupNumber).padStart(3, "0");

	return (
		<div className="min-h-screen bg-background">
			<div className="mx-auto max-w-lg px-4 py-16">
				<ShopCard padding="lg" className="space-y-6 text-center">
					{/* Success Icon */}
					<div className="flex justify-center">
						<div className="flex size-16 items-center justify-center rounded-full bg-success/10">
							<CheckCircle className="size-8 text-success" />
						</div>
					</div>

					{/* Title */}
					<div className="space-y-2">
						<ShopHeading as="h1" size="xl">
							{t("confirmation.title")}
						</ShopHeading>
						<ShopMutedText>{t("confirmation.subtitle")}</ShopMutedText>
					</div>

					{/* Pickup Number */}
					<div className="rounded-lg bg-muted py-6">
						<ShopMutedText className="text-sm">
							{t("confirmation.orderNumber")}
						</ShopMutedText>
						{isLoading ? (
							<Loader2 className="mx-auto mt-2 size-8 animate-spin text-muted-foreground" />
						) : (
							<ShopHeading as="p" size="2xl" className="text-4xl tabular-nums">
								#{formattedPickupNumber}
							</ShopHeading>
						)}
					</div>

					{/* Instructions */}
					<ShopMutedText className="text-sm">
						{t("confirmation.instructions")}
					</ShopMutedText>

					{/* Back to Menu */}
					<Link to="/$slug" params={{ slug: storeSlug }}>
						<ShopButton variant="primary" size="lg" className="w-full">
							{t("confirmation.backToMenu")}
						</ShopButton>
					</Link>
				</ShopCard>
			</div>
		</div>
	);
}
