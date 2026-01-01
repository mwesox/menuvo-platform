import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

interface StoreCardProps {
	store: {
		id: number;
		name: string;
		slug: string;
		street: string | null;
		city: string | null;
		imageUrl?: string | null;
		isOpen: boolean;
	};
}

export function StoreCard({ store }: StoreCardProps) {
	const addressParts = [store.street, store.city].filter(Boolean);
	const formattedAddress = addressParts.join(", ");

	return (
		<div
			className="group overflow-hidden rounded-2xl bg-shop-card transition-all duration-300 hover:-translate-y-1 animate-in fade-in duration-300"
			style={{ boxShadow: "var(--shop-shadow)" }}
		>
			<Link to="/shop/$slug" params={{ slug: store.slug }} className="block">
				{/* Image container */}
				<div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-amber-100 to-orange-100">
					{store.imageUrl && (
						<img
							src={store.imageUrl}
							alt={store.name}
							className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
						/>
					)}
				</div>

				{/* Content */}
				<div className="p-4">
					{/* Store name */}
					<h3
						className="text-lg text-shop-foreground"
						style={{ fontFamily: "var(--font-heading)" }}
					>
						{store.name}
					</h3>

					{/* Address */}
					{formattedAddress && (
						<p className="mt-1 flex items-center gap-1 text-sm text-shop-foreground-muted">
							<MapPin className="h-3.5 w-3.5 shrink-0" />
							<span className="truncate">{formattedAddress}</span>
						</p>
					)}

					{/* Status badge */}
					<div className="mt-2 flex items-center gap-1.5 text-sm">
						{store.isOpen ? (
							<>
								<span className="h-2 w-2 rounded-full bg-shop-success" />
								<span className="text-shop-success">Open now</span>
							</>
						) : (
							<>
								<span className="h-2 w-2 rounded-full border border-shop-foreground-muted bg-transparent" />
								<span className="text-shop-foreground-muted">Closed</span>
							</>
						)}
					</div>
				</div>
			</Link>
		</div>
	);
}
