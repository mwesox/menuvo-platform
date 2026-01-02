import { Link } from "@tanstack/react-router";
import {
	Mail,
	MapPin,
	Phone,
	Settings,
	Store as StoreIcon,
	Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader } from "@/components/ui/card.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import type { Store } from "@/db/schema.ts";

interface StoreCardProps {
	store: Store;
	onToggleActive: (storeId: number, isActive: boolean) => void;
	onDelete: (storeId: number) => void;
}

export function StoreCard({ store, onToggleActive, onDelete }: StoreCardProps) {
	const { t } = useTranslation("stores");
	const { t: tCommon } = useTranslation("common");
	const addressLine1 = store.street || "";
	const addressLine2 = [store.city, store.postalCode, store.country]
		.filter(Boolean)
		.join(", ");

	return (
		<Card className="overflow-hidden transition-shadow hover:shadow-md">
			<Link
				to="/console/stores/$storeId"
				params={{ storeId: String(store.id) }}
				className="block"
			>
				<CardHeader className="pb-4 transition-colors hover:bg-muted/50">
					<div className="flex items-start justify-between gap-4">
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
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation prevents Link navigation */}
						{/* biome-ignore lint/a11y/noStaticElementInteractions: container for Switch interaction */}
						<div
							className="flex items-center gap-2"
							onClick={(e) => e.stopPropagation()}
						>
							<span className="text-sm text-muted-foreground">
								{store.isActive
									? tCommon("labels.active")
									: tCommon("labels.inactive")}
							</span>
							<Switch
								checked={store.isActive}
								onCheckedChange={(checked) => onToggleActive(store.id, checked)}
							/>
						</div>
					</div>
				</CardHeader>
			</Link>

			<CardContent className="space-y-4">
				{(store.phone || store.email) && (
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
				)}

				<div className="flex items-center gap-2 border-t pt-4">
					<Button asChild className="flex-1">
						<Link
							to="/console/stores/$storeId"
							params={{ storeId: String(store.id) }}
						>
							<Settings className="mr-2 h-4 w-4" />
							{t("labels.manageStore")}
						</Link>
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="shrink-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
						onClick={() => onDelete(store.id)}
					>
						<Trash2 className="h-4 w-4" />
						<span className="sr-only">{t("labels.deleteStore")}</span>
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
