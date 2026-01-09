import { Card, CardContent, CardHeader, Skeleton } from "@menuvo/ui";
import {
	CardFormSkeleton,
	PageActionBarSkeleton,
} from "@/components/layout/skeletons";

/**
 * Skeleton for a single store card matching store-card.tsx layout.
 */
export function StoreCardSkeleton() {
	return (
		<Card className="h-full overflow-hidden">
			<CardHeader className="pb-4">
				<div className="flex items-start gap-4">
					{/* Icon */}
					<Skeleton className="size-12 shrink-0 rounded-lg" />
					<div className="flex-1 space-y-2">
						{/* Store name */}
						<Skeleton className="h-6 w-3/4" />
						{/* Address */}
						<div className="flex items-start gap-1.5">
							<Skeleton className="mt-0.5 size-4 shrink-0 rounded-full" />
							<div className="space-y-1">
								<Skeleton className="size-40" />
								<Skeleton className="h-4 w-32" />
							</div>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent className="pt-0">
				<div className="grid grid-cols-2 gap-4">
					<div className="flex items-center gap-2">
						<Skeleton className="size-4 rounded-full" />
						<Skeleton className="h-4 w-24" />
					</div>
					<div className="flex items-center gap-2">
						<Skeleton className="size-4 rounded-full" />
						<Skeleton className="h-4 w-32" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

/**
 * Skeleton for the stores list page.
 */
export function StoresPageSkeleton() {
	return (
		<div className="space-y-6">
			<PageActionBarSkeleton />

			<div className="grid gap-6 lg:grid-cols-2">
				<StoreCardSkeleton />
				<StoreCardSkeleton />
				<StoreCardSkeleton />
				<StoreCardSkeleton />
			</div>
		</div>
	);
}

/**
 * Skeleton for the store detail/edit page.
 * Matches the layout of $storeId.tsx with tabs and form sections.
 */
export function StoreDetailSkeleton() {
	return (
		<div className="space-y-6">
			<PageActionBarSkeleton withTabs />
			<StoreDetailContentSkeleton />
		</div>
	);
}

/**
 * Skeleton for the store detail content area only (without PageActionBar/tabs).
 * Used when tabs should remain visible during loading.
 */
export function StoreDetailContentSkeleton() {
	return (
		<div className="mt-6 space-y-6">
			{/* Active Status Toggle */}
			<div className="flex items-center justify-between rounded-lg border p-4">
				<div className="space-y-1">
					<Skeleton className="h-5 w-24" />
					<Skeleton className="size-48" />
				</div>
				<Skeleton className="h-6 w-11 rounded-full" />
			</div>

			{/* Store form card */}
			<CardFormSkeleton rows={5} />

			{/* Image fields card */}
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32" />
					<Skeleton className="mt-1 h-4 w-56" />
				</CardHeader>
				<CardContent>
					<Skeleton className="h-32 w-32 rounded-lg" />
				</CardContent>
			</Card>
		</div>
	);
}
