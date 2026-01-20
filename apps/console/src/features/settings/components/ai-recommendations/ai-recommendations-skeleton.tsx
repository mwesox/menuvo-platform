import { Card, Skeleton } from "@menuvo/ui";

export function AiRecommendationsPageSkeleton() {
	return (
		<div className="space-y-6">
			{/* Page header skeleton */}
			<Skeleton className="h-10 w-64" />

			{/* Card skeleton */}
			<Card className="p-6">
				<div className="space-y-6">
					<div className="space-y-2">
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-full max-w-md" />
					</div>

					<div className="space-y-4">
						<Skeleton className="h-12 w-full" />
						<Skeleton className="h-32 w-full" />
					</div>
				</div>
			</Card>

			{/* Button skeleton */}
			<Skeleton className="h-10 w-32" />
		</div>
	);
}
