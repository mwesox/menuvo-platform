import { Mail, MapPin, Phone, Store as StoreIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LinkCard } from "@menuvo/ui/link-card";
import type { Store } from "@menuvo/db/schema.ts";

interface StoreCardProps {
	store: Store;
}

export function StoreCard({ store }: StoreCardProps) {
	const { t } = useTranslation("stores");
	const addressLine1 = store.street || "";
	const addressLine2 = [store.city, store.postalCode, store.country]
		.filter(Boolean)
		.join(", ");

	const addressDescription =
		addressLine1 || addressLine2 ? (
			<div className="flex items-start gap-1.5">
				<MapPin className="mt-0.5 size-4 shrink-0" />
				<div>
					{addressLine1 && <div>{addressLine1}</div>}
					{addressLine2 && <div>{addressLine2}</div>}
				</div>
			</div>
		) : (
			<span>{t("labels.noAddressConfigured")}</span>
		);

	return (
		<LinkCard
			href={`/console/stores/${store.id}`}
			icon={StoreIcon}
			title={store.name}
			description={addressDescription}
		>
			{(store.phone || store.email) && (
				<div className="grid grid-cols-2 gap-4 text-sm">
					{store.phone && (
						<div className="flex items-center gap-2 text-muted-foreground">
							<Phone className="size-4 shrink-0" />
							<span className="truncate">{store.phone}</span>
						</div>
					)}
					{store.email && (
						<div className="flex items-center gap-2 text-muted-foreground">
							<Mail className="size-4 shrink-0" />
							<span className="truncate">{store.email}</span>
						</div>
					)}
				</div>
			)}
		</LinkCard>
	);
}
