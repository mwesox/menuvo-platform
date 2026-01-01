import { MapPin } from "lucide-react";

interface StoreHeroProps {
	store: {
		name: string;
		street: string | null;
		city: string | null;
		postalCode: string | null;
		isOpen: boolean;
		imageUrl?: string | null;
	};
}

export function StoreHero({ store }: StoreHeroProps) {
	const addressParts = [store.street, store.city, store.postalCode].filter(
		Boolean,
	);
	const formattedAddress = addressParts.join(", ");

	return (
		<div>
			{/* Banner */}
			<div className="h-48 bg-gradient-to-br from-amber-100 via-orange-50 to-amber-50 relative">
				{store.imageUrl && (
					<img
						src={store.imageUrl}
						alt={`${store.name} banner`}
						className="w-full h-full object-cover"
					/>
				)}
			</div>

			{/* Content */}
			<div className="px-4 py-5">
				{/* Store name */}
				<h1
					style={{ fontFamily: "var(--font-heading)" }}
					className="text-3xl text-shop-foreground"
				>
					{store.name}
				</h1>

				{/* Address */}
				{formattedAddress && (
					<p className="flex items-center gap-1.5 mt-2 text-shop-foreground-muted">
						<MapPin className="h-4 w-4 shrink-0" />
						<span>{formattedAddress}</span>
					</p>
				)}

				{/* Status indicator */}
				<div className="flex items-center gap-1.5 mt-2 text-sm">
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
		</div>
	);
}
