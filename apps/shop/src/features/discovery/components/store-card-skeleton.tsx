import { Skeleton } from "@menuvo/ui/components/skeleton";

export function StoreCardSkeleton() {
	return (
		<div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border/50">
			{/* Image skeleton - 16:10 aspect ratio to match card */}
			<Skeleton className="aspect-[16/10] rounded-none bg-muted" />

			{/* Content */}
			<div className="p-4 sm:p-5">
				{/* Store name skeleton */}
				<Skeleton className="h-6 w-3/4 bg-muted" />

				{/* Address skeleton */}
				<div className="mt-2 flex items-center gap-1.5">
					<Skeleton className="h-3.5 w-3.5 rounded-full bg-muted" />
					<Skeleton className="size-40 bg-muted" />
				</div>
			</div>
		</div>
	);
}

export function StoreCardSkeletonGrid() {
	return (
		<div className="grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7">
			<StoreCardSkeleton />
			<StoreCardSkeleton />
			<StoreCardSkeleton />
			<StoreCardSkeleton />
			<StoreCardSkeleton />
			<StoreCardSkeleton />
		</div>
	);
}
