import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { focusRing } from "../../shared/components/ui";

interface StoreCardProps {
	store: {
		id: string;
		name: string;
		slug: string;
		street: string | null;
		city: string | null;
		imageUrl?: string | null;
		isOpen: boolean;
	};
	style?: CSSProperties;
}

export function StoreCard({ store, style }: StoreCardProps) {
	const { t } = useTranslation("discovery");
	const addressParts = [store.street, store.city].filter(Boolean);
	const formattedAddress = addressParts.join(", ");

	return (
		<Link
			to="/$slug"
			params={{ slug: store.slug }}
			className={cn(
				"group block overflow-hidden rounded-2xl bg-card",
				"ring-1 ring-border/50",
				"transition-all duration-300 ease-out",
				"hover:shadow-black/[0.04] hover:shadow-lg hover:ring-border",
				"hover:-translate-y-0.5",
				"animate-card-enter",
				focusRing,
			)}
			style={style}
		>
			{/* Image container - cinematic 16:10 aspect ratio */}
			<div className="relative aspect-[16/10] overflow-hidden bg-muted">
				{store.imageUrl ? (
					<img
						src={store.imageUrl}
						alt={store.name}
						className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
					/>
				) : (
					/* Placeholder gradient for missing images */
					<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
						<span
							className="font-medium text-4xl text-muted-foreground/30"
							style={{ fontFamily: "var(--font-heading)" }}
						>
							{store.name.charAt(0)}
						</span>
					</div>
				)}

				{/* Status badge - positioned on image */}
				<div className="absolute bottom-3 left-3">
					<span
						className={cn(
							"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
							"font-medium text-xs backdrop-blur-md",
							store.isOpen
								? "bg-emerald-500/90 text-white"
								: "bg-black/60 text-white/90",
						)}
					>
						<span
							className={cn(
								"h-1.5 w-1.5 rounded-full",
								store.isOpen ? "animate-pulse bg-white" : "bg-white/60",
							)}
						/>
						{store.isOpen ? t("storeCard.openNow") : t("storeCard.closed")}
					</span>
				</div>
			</div>

			{/* Content - more breathing room */}
			<div className="p-4 sm:p-5">
				<h3
					className="font-medium text-foreground text-lg sm:text-xl"
					style={{ fontFamily: "var(--font-heading)" }}
				>
					{store.name}
				</h3>

				{formattedAddress && (
					<p className="mt-1.5 flex items-center gap-1.5 text-muted-foreground text-sm">
						<MapPin className="h-3.5 w-3.5 shrink-0 opacity-60" />
						<span className="truncate">{formattedAddress}</span>
					</p>
				)}
			</div>
		</Link>
	);
}
