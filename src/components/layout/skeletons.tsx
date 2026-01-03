import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton for PageActionBar with optional tabs.
 * Use this as a building block for page-level skeletons.
 */
export function PageActionBarSkeleton({
	withTabs = false,
}: {
	withTabs?: boolean;
}) {
	return (
		<div className="border-b border-border">
			{/* Row 1: Title + Actions */}
			<div className="flex h-12 items-center justify-between px-0">
				<Skeleton className="h-6 w-32" />
				<Skeleton className="h-9 w-28" />
			</div>

			{/* Row 2: Tabs (optional) */}
			{withTabs && (
				<div className="flex gap-6 pb-3">
					<Skeleton className="h-5 w-20" />
					<Skeleton className="h-5 w-24" />
					<Skeleton className="h-5 w-16" />
				</div>
			)}
		</div>
	);
}

/**
 * Skeleton for a card with a form inside.
 * Renders a card with header and configurable number of form field rows.
 */
export function CardFormSkeleton({ rows = 4 }: { rows?: number }) {
	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-6 w-40" />
				<Skeleton className="h-4 w-64 mt-1" />
			</CardHeader>
			<CardContent className="space-y-4">
				{Array.from({ length: rows }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton elements
					<div key={i} className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-10 w-full" />
					</div>
				))}
			</CardContent>
		</Card>
	);
}

/**
 * Skeleton for tab navigation.
 */
export function TabsSkeleton({ count = 3 }: { count?: number }) {
	return (
		<div className="flex gap-6 border-b border-border pb-3">
			{Array.from({ length: count }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton elements
				<Skeleton key={i} className="h-5 w-20" />
			))}
		</div>
	);
}

/**
 * Skeleton for a simple list item in a master list.
 */
export function ListItemSkeleton() {
	return (
		<div className="flex items-center gap-3 px-3 py-2.5 rounded-md">
			<Skeleton className="h-8 w-8 rounded" />
			<div className="flex-1 space-y-1">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="h-3 w-20" />
			</div>
		</div>
	);
}

/**
 * Skeleton for a master list panel with multiple items.
 */
export function MasterListSkeleton({ items = 5 }: { items?: number }) {
	return (
		<div className="space-y-1">
			{Array.from({ length: items }).map((_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton elements
				<ListItemSkeleton key={i} />
			))}
		</div>
	);
}

/**
 * Skeleton for a detail panel on the right side of master-detail layout.
 */
export function DetailPanelSkeleton() {
	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-6 w-48" />
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-10 w-full" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-20 w-full" />
				</div>
				<div className="flex justify-end gap-2 pt-4">
					<Skeleton className="h-9 w-20" />
					<Skeleton className="h-9 w-24" />
				</div>
			</CardContent>
		</Card>
	);
}
