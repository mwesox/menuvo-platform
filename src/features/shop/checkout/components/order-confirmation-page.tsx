"use client";

import { Link } from "@tanstack/react-router";
import { CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
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

					{/* Order Number */}
					<div className="rounded-lg bg-muted py-4">
						<ShopMutedText className="text-sm">
							{t("confirmation.orderNumber")}
						</ShopMutedText>
						<ShopHeading as="p" size="2xl" className="tabular-nums">
							#{orderId}
						</ShopHeading>
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
