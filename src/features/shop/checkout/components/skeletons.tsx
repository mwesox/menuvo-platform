import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton for the checkout page.
 * Matches the warm shop theme.
 */
export function CheckoutPageSkeleton() {
	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-lg mx-auto px-4 py-6">
				{/* Header */}
				<Skeleton className="h-8 w-32 mb-6 bg-muted" />

				<div className="space-y-6">
					{/* Order Type Selection Card */}
					<div className="rounded-xl bg-card p-4 space-y-4">
						<Skeleton className="h-5 w-24 bg-muted" />
						<div className="space-y-3">
							<div className="flex items-center gap-3">
								<Skeleton className="size-4 rounded-full bg-muted" />
								<Skeleton className="h-4 w-20 bg-muted" />
							</div>
							<div className="flex items-center gap-3">
								<Skeleton className="size-4 rounded-full bg-muted" />
								<Skeleton className="h-4 w-24 bg-muted" />
							</div>
							<div className="flex items-center gap-3">
								<Skeleton className="size-4 rounded-full bg-muted" />
								<Skeleton className="h-4 w-20 bg-muted" />
							</div>
						</div>
					</div>

					{/* Customer Name Card */}
					<div className="rounded-xl bg-card p-4 space-y-3">
						<Skeleton className="h-5 w-24 bg-muted" />
						<Skeleton className="h-10 w-full rounded-md bg-muted" />
					</div>

					{/* Order Summary Card */}
					<div className="rounded-xl bg-card p-4 space-y-4">
						<Skeleton className="h-5 w-32 bg-muted" />
						<div className="space-y-3">
							<div className="flex justify-between">
								<Skeleton className="size-40 bg-muted" />
								<Skeleton className="h-4 w-12 bg-muted" />
							</div>
							<div className="flex justify-between">
								<Skeleton className="h-4 w-32 bg-muted" />
								<Skeleton className="h-4 w-12 bg-muted" />
							</div>
						</div>
						<div className="pt-3 border-t border-border">
							<div className="flex justify-between">
								<Skeleton className="h-5 w-16 bg-muted" />
								<Skeleton className="h-5 w-16 bg-muted" />
							</div>
						</div>
					</div>

					{/* Submit Button */}
					<Skeleton className="h-12 w-full rounded-full bg-muted" />
				</div>
			</div>
		</div>
	);
}

/**
 * Skeleton for the order confirmation page.
 */
export function OrderConfirmationPageSkeleton() {
	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-lg mx-auto px-4 py-6">
				{/* Success icon placeholder */}
				<div className="flex flex-col items-center mb-6">
					<Skeleton className="size-16 rounded-full bg-muted mb-4" />
					<Skeleton className="h-8 w-48 bg-muted mb-2" />
					<Skeleton className="h-4 w-64 bg-muted" />
				</div>

				{/* Order details card */}
				<div className="rounded-xl bg-card p-4 space-y-4">
					<div className="flex justify-between items-center">
						<Skeleton className="h-5 w-20 bg-muted" />
						<Skeleton className="h-6 w-16 rounded-full bg-muted" />
					</div>
					<div className="space-y-3">
						<div className="flex justify-between">
							<Skeleton className="h-4 w-32 bg-muted" />
							<Skeleton className="h-4 w-12 bg-muted" />
						</div>
						<div className="flex justify-between">
							<Skeleton className="h-4 w-28 bg-muted" />
							<Skeleton className="h-4 w-12 bg-muted" />
						</div>
					</div>
					<div className="pt-3 border-t border-border">
						<div className="flex justify-between">
							<Skeleton className="h-5 w-12 bg-muted" />
							<Skeleton className="h-5 w-16 bg-muted" />
						</div>
					</div>
				</div>

				{/* Back to menu button */}
				<Skeleton className="h-12 w-full rounded-full bg-muted mt-6" />
			</div>
		</div>
	);
}
