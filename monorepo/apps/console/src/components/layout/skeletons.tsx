import { Card, CardContent, CardHeader } from "@menuvo/ui/card";
import { Skeleton } from "@menuvo/ui/skeleton";

// Pre-generated stable keys for skeleton items (skeletons are static, never reorder)
const MASTER_LIST_KEYS = ["ml-1", "ml-2", "ml-3", "ml-4", "ml-5"] as const;
const DETAIL_PANEL_KEYS = ["dp-1", "dp-2", "dp-3", "dp-4"] as const;

interface PageActionBarSkeletonProps {
	withTabs?: boolean;
}

export function PageActionBarSkeleton({
	withTabs = false,
}: PageActionBarSkeletonProps) {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-10 w-32" />
			</div>
			{withTabs && (
				<div className="flex gap-2">
					<Skeleton className="h-9 w-24" />
					<Skeleton className="h-9 w-24" />
					<Skeleton className="h-9 w-24" />
				</div>
			)}
		</div>
	);
}

interface CardFormSkeletonProps {
	rows?: number;
}

export function CardFormSkeleton({ rows = 3 }: CardFormSkeletonProps) {
	// Generate stable keys based on row count (skeleton rows are static, never reorder)
	const rowKeys = Array.from({ length: rows }, (_, i) => `form-row-${i}`);

	return (
		<Card>
			<CardHeader>
				<Skeleton className="h-6 w-40" />
				<Skeleton className="mt-1 h-4 w-64" />
			</CardHeader>
			<CardContent className="space-y-4">
				{rowKeys.map((key) => (
					<div key={key} className="space-y-2">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-10 w-full" />
					</div>
				))}
				<Skeleton className="mt-4 h-10 w-28" />
			</CardContent>
		</Card>
	);
}

export function MasterListSkeleton() {
	return (
		<div className="space-y-3">
			{MASTER_LIST_KEYS.map((key) => (
				<div
					key={key}
					className="flex items-center gap-4 rounded-lg border p-4"
				>
					<Skeleton className="h-10 w-10 rounded" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-3 w-24" />
					</div>
				</div>
			))}
		</div>
	);
}

export function DetailPanelSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Skeleton className="h-16 w-16 rounded-lg" />
				<div className="space-y-2">
					<Skeleton className="h-6 w-40" />
					<Skeleton className="h-4 w-24" />
				</div>
			</div>
			<div className="space-y-4">
				{DETAIL_PANEL_KEYS.map((key) => (
					<div key={key} className="space-y-2">
						<Skeleton className="h-4 w-20" />
						<Skeleton className="h-5 w-full" />
					</div>
				))}
			</div>
		</div>
	);
}
