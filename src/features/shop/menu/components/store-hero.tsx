import { MapPin } from "lucide-react";
import { ShopStatusIndicator } from "../../shared/components/ui";

interface StoreHeroProps {
	store: {
		name: string;
		description?: string | null;
		street: string | null;
		city: string | null;
		postalCode: string | null;
		isOpen: boolean;
		imageUrl?: string | null;
	};
}

/** Generate a simple hash from store name for consistent but varied patterns */
function hashString(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return Math.abs(hash);
}

// Curated warm earth-tone palettes for sophisticated food aesthetic
const PALETTES = [
	// Amber & Cream
	{
		bg: ["#FAF7F2", "#F5F0E8"],
		accent1: "#E8D5B7",
		accent2: "#D4B896",
		accent3: "#C9A86C",
	},
	// Terracotta & Sand
	{
		bg: ["#FBF8F4", "#F7F0E6"],
		accent1: "#E2C4B3",
		accent2: "#D4A58A",
		accent3: "#C4826A",
	},
	// Sage & Stone
	{
		bg: ["#F8FAF7", "#F2F5EE"],
		accent1: "#D5DDD0",
		accent2: "#B8C4AD",
		accent3: "#9CA88B",
	},
	// Warm Brown & Oat
	{
		bg: ["#FAF8F5", "#F5F1EB"],
		accent1: "#E0D4C4",
		accent2: "#C9B99E",
		accent3: "#A89778",
	},
	// Soft Olive & Wheat
	{
		bg: ["#FAFAF6", "#F4F4EC"],
		accent1: "#DDD9C4",
		accent2: "#C4BEA3",
		accent3: "#A8A282",
	},
];

/** Sophisticated layered wave pattern with warm earth tones */
function AbstractPattern({ storeName }: { storeName: string }) {
	const hash = hashString(storeName);
	const palette = PALETTES[hash % PALETTES.length];

	// Generate subtle variations for wave curves
	const wave1Y = 8 + (hash % 8);
	const wave2Y = 18 + ((hash >> 3) % 8);
	const wave3Y = 30 + ((hash >> 6) % 8);

	// Control points for organic bezier curves
	const cp1 = 20 + ((hash >> 2) % 15);
	const cp2 = 50 + ((hash >> 4) % 20);
	const cp3 = 75 + ((hash >> 5) % 15);

	return (
		<svg
			className="absolute inset-0 h-full w-full"
			viewBox="0 0 100 50"
			preserveAspectRatio="xMidYMid slice"
			aria-hidden="true"
		>
			<defs>
				{/* Subtle gradient background */}
				<linearGradient
					id={`bg-${hash}`}
					x1="0%"
					y1="0%"
					x2="100%"
					y2="100%"
				>
					<stop offset="0%" stopColor={palette.bg[0]} />
					<stop offset="100%" stopColor={palette.bg[1]} />
				</linearGradient>

				{/* Soft blur for organic feel */}
				<filter id={`blur-${hash}`}>
					<feGaussianBlur in="SourceGraphic" stdDeviation="0.5" />
				</filter>
			</defs>

			{/* Background */}
			<rect width="100" height="50" fill={`url(#bg-${hash})`} />

			{/* Layered organic wave shapes - back to front */}
			<path
				d={`M0 ${wave3Y + 15}
					Q ${cp1} ${wave3Y + 5}, ${cp2} ${wave3Y + 12}
					T 100 ${wave3Y + 8}
					L100 50 L0 50 Z`}
				fill={palette.accent1}
				opacity="0.4"
				filter={`url(#blur-${hash})`}
			/>

			<path
				d={`M0 ${wave2Y + 12}
					Q ${cp2 - 10} ${wave2Y}, ${cp3 - 5} ${wave2Y + 8}
					T 100 ${wave2Y + 5}
					L100 50 L0 50 Z`}
				fill={palette.accent2}
				opacity="0.35"
				filter={`url(#blur-${hash})`}
			/>

			<path
				d={`M0 ${wave1Y + 8}
					Q ${cp1 + 5} ${wave1Y - 2}, ${cp2 + 10} ${wave1Y + 5}
					T 100 ${wave1Y}
					L100 50 L0 50 Z`}
				fill={palette.accent3}
				opacity="0.25"
				filter={`url(#blur-${hash})`}
			/>

			{/* Subtle grain texture overlay */}
			<rect
				width="100"
				height="50"
				fill="url(#grain)"
				opacity="0.03"
				style={{ mixBlendMode: "multiply" }}
			/>
		</svg>
	);
}

export function StoreHero({ store }: StoreHeroProps) {
	const addressParts = [store.street, store.city, store.postalCode].filter(
		Boolean,
	);
	const formattedAddress = addressParts.join(", ");

	return (
		<div className="relative">
			{/* Background - abstract pattern or image */}
			<div className="h-44 relative overflow-hidden">
				{store.imageUrl ? (
					<img
						src={store.imageUrl}
						alt={`${store.name} banner`}
						className="absolute inset-0 h-full w-full object-cover"
					/>
				) : (
					<AbstractPattern storeName={store.name} />
				)}
				{/* Gradient overlay for text readability */}
				<div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
			</div>

			{/* Content positioned over gradient */}
			<div className="relative -mt-16 px-4 pb-4">
				{/* Store name - large, prominent */}
				<h1
					className="text-3xl text-foreground tracking-tight"
					style={{ fontFamily: "var(--font-heading)" }}
				>
					{store.name}
				</h1>

				{/* Meta row - address + status */}
				<div className="flex items-center gap-3 mt-2 text-sm">
					{formattedAddress && (
						<>
							<span className="flex items-center gap-1.5 text-muted-foreground">
								<MapPin className="h-4 w-4 shrink-0" />
								<span>{formattedAddress}</span>
							</span>
							<span className="h-3 w-px bg-border" aria-hidden="true" />
						</>
					)}
					<ShopStatusIndicator isOpen={store.isOpen} />
				</div>

				{/* Optional store description */}
				{store.description && (
					<p className="mt-3 text-muted-foreground text-sm leading-relaxed max-w-md">
						{store.description}
					</p>
				)}
			</div>
		</div>
	);
}
