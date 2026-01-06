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
	orderId: number;
	storeSlug: string;
}

export function OrderConfirmationPage({
	orderId,
	storeSlug,
}: OrderConfirmationPageProps) {
	const { t } = useTranslation("shop");

	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-lg mx-auto px-4 py-16">
				<ShopCard padding="lg" className="text-center space-y-6">
					{/* Success Icon */}
					<div className="flex justify-center">
						<div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
							<CheckCircle className="w-8 h-8 text-success" />
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
					<div className="py-4 bg-muted rounded-lg">
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
