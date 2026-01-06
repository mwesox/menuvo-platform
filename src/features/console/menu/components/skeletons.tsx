import {
	CardFormSkeleton,
	DetailPanelSkeleton,
	MasterListSkeleton,
	PageActionBarSkeleton,
} from "@/components/layout/skeletons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton for the main menu page with master-detail layout.
 */
export function MenuPageSkeleton() {
	return (
		<div className="flex flex-col h-full">
			<PageActionBarSkeleton withTabs />

			{/* Master-detail layout skeleton */}
			<div className="flex-1 mt-4 min-h-0">
				<div className="flex gap-6 h-full">
					{/* Master list */}
					<div className="w-80 shrink-0 overflow-auto rounded-lg border">
						<div className="p-2">
							<MasterListSkeleton items={6} />
						</div>
					</div>

					{/* Detail panel - hidden on mobile */}
					<div className="hidden md:block flex-1 overflow-auto">
						<DetailPanelSkeleton />
					</div>
				</div>
			</div>
		</div>
	);
}

/**
 * Skeleton for the item edit/create form page.
 */
export function ItemFormSkeleton() {
	return (
		<div className="space-y-6">
			<PageActionBarSkeleton />

			<div className="grid gap-6 lg:grid-cols-3">
				{/* Main form - 2 columns */}
				<div className="lg:col-span-2 space-y-6">
					{/* Basic info card */}
					<CardFormSkeleton rows={3} />

					{/* Description card */}
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-32" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-24 w-full" />
						</CardContent>
					</Card>

					{/* Options card */}
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-40" />
							<Skeleton className="h-4 w-64 mt-1" />
						</CardHeader>
						<CardContent className="space-y-2">
							<div className="flex items-center gap-3">
								<Skeleton className="size-5 rounded" />
								<Skeleton className="h-5 w-32" />
							</div>
							<div className="flex items-center gap-3">
								<Skeleton className="size-5 rounded" />
								<Skeleton className="h-5 w-28" />
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Sidebar - 1 column */}
				<div className="space-y-6">
					{/* Image upload card */}
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-24" />
						</CardHeader>
						<CardContent>
							<Skeleton className="aspect-square w-full rounded-lg" />
						</CardContent>
					</Card>

					{/* Availability card */}
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-28" />
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex items-center justify-between">
								<Skeleton className="h-5 w-20" />
								<Skeleton className="h-6 w-11 rounded-full" />
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}

/**
 * Skeleton for the category items page (drill-down view).
 */
export function CategoryItemsPageSkeleton() {
	return (
		<div className="space-y-6">
			<PageActionBarSkeleton />

			{/* Items grid */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{Array.from({ length: 6 }).map((_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: Static skeleton elements
					<Card key={i} className="overflow-hidden">
						{/* Item image */}
						<Skeleton className="aspect-video w-full" />
						<CardContent className="p-4 space-y-2">
							<Skeleton className="h-5 w-3/4" />
							<Skeleton className="h-4 w-full" />
							<div className="flex items-center justify-between pt-2">
								<Skeleton className="h-5 w-16" />
								<Skeleton className="h-6 w-11 rounded-full" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

/**
 * Skeleton for the new item page.
 */
export function NewItemPageSkeleton() {
	return <ItemFormSkeleton />;
}
