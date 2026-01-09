import { Skeleton } from "@menuvo/ui/components/skeleton";

/**
 * Skeleton shown while store data is loading during navigation.
 * Prevents flickering by showing a consistent layout structure.
 */
export function ShopLayoutSkeleton() {
	return (
		<div className="flex min-h-screen flex-col bg-background">
			{/* Header skeleton */}
			<header
				className="sticky top-0 z-50 border-b backdrop-blur-md"
				style={{
					backgroundColor: "oklch(0.988 0.003 90 / 0.95)",
					borderColor: "var(--border)",
				}}
			>
				<div className="flex h-14 items-center gap-4 px-4">
					{/* Back link skeleton */}
					<div className="flex shrink-0 items-center gap-1">
						<Skeleton className="size-4 bg-muted" />
						<Skeleton className="hidden h-8 w-24 bg-muted sm:block" />
					</div>

					{/* Store info skeleton - center */}
					<div className="flex min-w-0 flex-1 justify-center">
						<Skeleton className="h-5 w-32 bg-muted" />
					</div>

					{/* Search + Cart skeleton - right */}
					<div className="flex shrink-0 items-center gap-2">
						<Skeleton className="hidden h-9 w-64 rounded-lg bg-muted md:block" />
						<Skeleton className="size-9 rounded-md bg-muted" />
					</div>
				</div>
			</header>

			{/* Main content skeleton */}
			<main className="flex-1">
				<div className="min-h-screen pb-24">
					{/* Category nav skeleton */}
					<div className="sticky top-14 z-30 border-border border-b bg-background">
						<div className="flex gap-2 px-4 py-3">
							<Skeleton className="h-8 w-24 rounded-full bg-muted" />
							<Skeleton className="h-8 w-20 rounded-full bg-muted" />
							<Skeleton className="h-8 w-28 rounded-full bg-muted" />
						</div>
					</div>

					{/* Menu items skeleton */}
					<div className="px-4 py-4">
						<Skeleton className="mb-3 h-7 w-40 bg-muted" />
						<div className="space-y-3">
							<div className="flex gap-3 rounded-xl bg-card p-3">
								<Skeleton className="size-20 shrink-0 rounded-lg bg-muted" />
								<div className="flex min-w-0 flex-1 flex-col justify-between">
									<div>
										<Skeleton className="h-5 w-2/3 bg-muted" />
										<Skeleton className="mt-1.5 h-4 w-full bg-muted" />
									</div>
									<div className="mt-2 flex items-center justify-between">
										<Skeleton className="h-5 w-16 bg-muted" />
										<Skeleton className="h-8 w-20 rounded-lg bg-muted" />
									</div>
								</div>
							</div>
							<div className="flex gap-3 rounded-xl bg-card p-3">
								<Skeleton className="size-20 shrink-0 rounded-lg bg-muted" />
								<div className="flex min-w-0 flex-1 flex-col justify-between">
									<div>
										<Skeleton className="h-5 w-1/2 bg-muted" />
										<Skeleton className="mt-1.5 h-4 w-3/4 bg-muted" />
									</div>
									<div className="mt-2 flex items-center justify-between">
										<Skeleton className="h-5 w-16 bg-muted" />
										<Skeleton className="h-8 w-20 rounded-lg bg-muted" />
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
