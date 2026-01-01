import { Skeleton } from "@/components/ui/skeleton";

export function StoreCardSkeleton() {
	return (
		<div
			className="overflow-hidden rounded-2xl bg-card"
			style={{
				boxShadow:
					"0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
			}}
		>
			{/* Image skeleton */}
			<Skeleton className="aspect-[16/9] rounded-none bg-muted" />

			{/* Content */}
			<div className="p-4">
				{/* Store name skeleton */}
				<Skeleton className="h-6 w-3/4 bg-muted" />

				{/* Address skeleton */}
				<div className="mt-2 flex items-center gap-1">
					<Skeleton className="h-3.5 w-3.5 rounded-full bg-muted" />
					<Skeleton className="h-4 w-40 bg-muted" />
				</div>

				{/* Status badge skeleton */}
				<div className="mt-3 flex items-center gap-1.5">
					<Skeleton className="h-2 w-2 rounded-full bg-muted" />
					<Skeleton className="h-4 w-16 bg-muted" />
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
