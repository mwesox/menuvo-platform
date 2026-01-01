import { Skeleton } from "@/components/ui/skeleton";

export function StoreCardSkeleton() {
	return (
		<div
			className="overflow-hidden rounded-2xl bg-shop-card"
			style={{ boxShadow: "var(--shop-shadow)" }}
		>
			{/* Image skeleton */}
			<Skeleton className="aspect-[16/9] rounded-none bg-shop-background-subtle" />

			{/* Content */}
			<div className="p-4">
				{/* Store name skeleton */}
				<Skeleton className="h-6 w-3/4 bg-shop-background-subtle" />

				{/* Address skeleton */}
				<div className="mt-2 flex items-center gap-1">
					<Skeleton className="h-3.5 w-3.5 rounded-full bg-shop-background-subtle" />
					<Skeleton className="h-4 w-40 bg-shop-background-subtle" />
				</div>

				{/* Status badge skeleton */}
				<div className="mt-3 flex items-center gap-1.5">
					<Skeleton className="h-2 w-2 rounded-full bg-shop-background-subtle" />
					<Skeleton className="h-4 w-16 bg-shop-background-subtle" />
				</div>
			</div>
		</div>
	);
}

export function StoreCardSkeletonGrid() {
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			<StoreCardSkeleton />
			<StoreCardSkeleton />
			<StoreCardSkeleton />
			<StoreCardSkeleton />
			<StoreCardSkeleton />
			<StoreCardSkeleton />
		</div>
	);
}
