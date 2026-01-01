import { Skeleton } from "@/components/ui/skeleton";

export function MenuItemSkeleton() {
	return (
		<div className="flex gap-3 p-3 bg-shop-card rounded-xl">
			{/* Image skeleton */}
			<Skeleton className="w-20 h-20 rounded-lg flex-shrink-0 bg-shop-background-subtle" />

			{/* Content skeleton */}
			<div className="flex-1 min-w-0 flex flex-col justify-between">
				<div>
					{/* Title */}
					<Skeleton className="h-5 w-2/3 bg-shop-background-subtle" />
					{/* Description */}
					<Skeleton className="h-4 w-full mt-1.5 bg-shop-background-subtle" />
					<Skeleton className="h-4 w-3/4 mt-1 bg-shop-background-subtle" />
				</div>

				{/* Bottom row */}
				<div className="flex items-center justify-between mt-2">
					<Skeleton className="h-5 w-16 bg-shop-background-subtle" />
					<Skeleton className="h-8 w-20 rounded-lg bg-shop-background-subtle" />
				</div>
			</div>
		</div>
	);
}

export function CategorySkeleton() {
	return (
		<div className="mb-8">
			{/* Category header skeleton */}
			<Skeleton className="h-7 w-40 mb-3 bg-shop-background-subtle" />

			{/* Items skeleton */}
			<div className="space-y-3">
				<MenuItemSkeleton />
				<MenuItemSkeleton />
				<MenuItemSkeleton />
			</div>
		</div>
	);
}

export function StorePageSkeleton() {
	return (
		<div className="min-h-screen pb-24">
			{/* Hero skeleton */}
			<div className="relative h-48 bg-gradient-to-br from-amber-100 to-orange-50">
				<div className="absolute inset-x-0 bottom-0 p-4">
					<Skeleton className="h-8 w-48 mb-2 bg-white/30" />
					<Skeleton className="h-4 w-64 bg-white/20" />
				</div>
			</div>

			{/* Category nav skeleton */}
			<div className="sticky top-14 z-30 bg-shop-background border-b border-shop-border">
				<div className="flex gap-2 px-4 py-3">
					<Skeleton className="h-8 w-24 rounded-full bg-shop-background-subtle" />
					<Skeleton className="h-8 w-20 rounded-full bg-shop-background-subtle" />
					<Skeleton className="h-8 w-28 rounded-full bg-shop-background-subtle" />
					<Skeleton className="h-8 w-24 rounded-full bg-shop-background-subtle" />
				</div>
			</div>

			{/* Menu sections skeleton */}
			<div className="px-4 py-4">
				<CategorySkeleton />
				<CategorySkeleton />
			</div>
		</div>
	);
}
