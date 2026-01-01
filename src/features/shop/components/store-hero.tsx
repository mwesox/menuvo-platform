import { MapPin } from "lucide-react";
import { ShopHeading, ShopMutedText, ShopStatusIndicator } from "./ui";

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
				<ShopHeading as="h1" size="2xl">
					{store.name}
				</ShopHeading>

				{/* Address */}
				{formattedAddress && (
					<ShopMutedText className="flex items-center gap-1.5 mt-2">
						<MapPin className="h-4 w-4 shrink-0" />
						<span>{formattedAddress}</span>
					</ShopMutedText>
				)}

				{/* Status indicator */}
				<ShopStatusIndicator isOpen={store.isOpen} className="mt-2" />
			</div>
		</div>
	);
}
