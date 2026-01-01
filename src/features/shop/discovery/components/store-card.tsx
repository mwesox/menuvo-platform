import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import {
	focusRing,
	ShopHeading,
	ShopMutedText,
	ShopStatusIndicator,
} from "../../shared/components/ui";

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
		<Link
			to="/shop/$slug"
			params={{ slug: store.slug }}
			className={`group block overflow-hidden rounded-2xl bg-card shadow-md transition-all duration-300 hover:-translate-y-1 animate-in fade-in duration-300 ${focusRing}`}
		>
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
				<ShopHeading as="h3" size="md">
					{store.name}
				</ShopHeading>

				{/* Address */}
				{formattedAddress && (
					<ShopMutedText className="mt-1 flex items-center gap-1 text-sm">
						<MapPin className="h-3.5 w-3.5 shrink-0" />
						<span className="truncate">{formattedAddress}</span>
					</ShopMutedText>
				)}

				{/* Status badge */}
				<ShopStatusIndicator isOpen={store.isOpen} className="mt-2" />
			</div>
		</Link>
	);
}
