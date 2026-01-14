import type { AppRouter } from "@menuvo/api/trpc";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@menuvo/ui";
import { Link } from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";
import { Mail, MapPin, Phone, Store as StoreIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Store = RouterOutput["store"]["list"][number];

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
		<Link
			to="/stores/$storeId"
			params={{ storeId: store.id }}
			className="block"
		>
			<Card className="group h-full cursor-pointer overflow-hidden transition-all hover:bg-muted/30 hover:shadow-md">
				<CardHeader className="flex-row items-start gap-4 pb-4">
					<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
						<StoreIcon className="h-6 w-6 text-primary" />
					</div>
					<div className="min-w-0 flex-1 space-y-1">
						<CardTitle className="flex items-center gap-2 font-semibold text-xl tracking-tight">
							{store.name}
						</CardTitle>
						<CardDescription className="text-sm">
							{addressDescription}
						</CardDescription>
					</div>
				</CardHeader>
				{(store.phone || store.email) && (
					<CardContent className="pt-0">
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
					</CardContent>
				)}
			</Card>
		</Link>
	);
}
