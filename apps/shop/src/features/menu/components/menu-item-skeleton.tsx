import { Skeleton } from "@menuvo/ui/components/skeleton";

export function MenuItemSkeleton() {
	return (
		<div className="flex gap-3 rounded-xl bg-card p-3">
			{/* Image skeleton */}
			<Skeleton className="h-20 w-20 flex-shrink-0 rounded-lg bg-muted" />

			{/* Content skeleton */}
			<div className="flex min-w-0 flex-1 flex-col justify-between">
				<div>
					{/* Title */}
					<Skeleton className="h-5 w-2/3 bg-muted" />
					{/* Description */}
					<Skeleton className="mt-1.5 h-4 w-full bg-muted" />
					<Skeleton className="mt-1 h-4 w-3/4 bg-muted" />
				</div>

				{/* Bottom row */}
				<div className="mt-2 flex items-center justify-between">
					<Skeleton className="h-5 w-16 bg-muted" />
					<Skeleton className="h-8 w-20 rounded-lg bg-muted" />
				</div>
			</div>
		</div>
	);
}

export function CategorySkeleton() {
	return (
		<div className="mb-8">
			{/* Category header skeleton */}
			<Skeleton className="mb-3 h-7 w-40 bg-muted" />

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
					<Skeleton className="mb-2 h-8 w-48 bg-white/30" />
					<Skeleton className="h-4 w-64 bg-white/20" />
				</div>
			</div>

			{/* Category nav skeleton */}
			<div className="sticky top-14 z-30 border-border border-b bg-background">
				<div className="flex gap-2 px-4 py-3">
					<Skeleton className="h-8 w-24 rounded-full bg-muted" />
					<Skeleton className="h-8 w-20 rounded-full bg-muted" />
					<Skeleton className="h-8 w-28 rounded-full bg-muted" />
					<Skeleton className="h-8 w-24 rounded-full bg-muted" />
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
