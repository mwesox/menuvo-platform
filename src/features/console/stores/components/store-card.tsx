import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone, Store as StoreIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader } from "@/components/ui/card.tsx";
import type { Store } from "@/db/schema.ts";

interface StoreCardProps {
	store: Store;
}

export function StoreCard({ store }: StoreCardProps) {
	const { t } = useTranslation("stores");
	const addressLine1 = store.street || "";
	const addressLine2 = [store.city, store.postalCode, store.country]
		.filter(Boolean)
		.join(", ");

	return (
		<Link
			to="/console/stores/$storeId"
			params={{ storeId: String(store.id) }}
			className="block"
		>
			<Card className="h-full overflow-hidden transition-all hover:shadow-md hover:bg-muted/30">
				<CardHeader className="pb-4">
					<div className="flex items-start gap-4">
						<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
							<StoreIcon className="h-6 w-6 text-primary" />
						</div>
						<div className="space-y-1">
							<h3 className="text-xl font-semibold tracking-tight">
								{store.name}
							</h3>
							{(addressLine1 || addressLine2) && (
								<div className="flex items-start gap-1.5 text-sm text-muted-foreground">
									<MapPin className="mt-0.5 h-4 w-4 shrink-0" />
									<div>
										{addressLine1 && <div>{addressLine1}</div>}
										{addressLine2 && <div>{addressLine2}</div>}
									</div>
								</div>
							)}
							{!addressLine1 && !addressLine2 && (
								<p className="text-sm text-muted-foreground">
									{t("labels.noAddressConfigured")}
								</p>
							)}
						</div>
					</div>
				</CardHeader>

				{(store.phone || store.email) && (
					<CardContent className="pt-0">
						<div className="grid grid-cols-2 gap-4 text-sm">
							{store.phone && (
								<div className="flex items-center gap-2 text-muted-foreground">
									<Phone className="h-4 w-4 shrink-0" />
									<span className="truncate">{store.phone}</span>
								</div>
							)}
							{store.email && (
								<div className="flex items-center gap-2 text-muted-foreground">
									<Mail className="h-4 w-4 shrink-0" />
									<span className="truncate">{store.email}</span>
								</div>
							)}
						</div>
					</CardContent>
				)}
			</Card>
		</Link>
	);
}
