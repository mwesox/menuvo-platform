import {
	CardFormSkeleton,
	PageActionBarSkeleton,
} from "@/components/layout/skeletons";
import { Card, CardContent, CardHeader } from "@menuvo/ui/card";
import { Skeleton } from "@menuvo/ui/skeleton";

/**
 * Skeleton for a settings navigation card.
 */
function SettingsNavCardSkeleton() {
	return (
		<Card>
			<CardContent className="p-6">
				<div className="flex items-start gap-4">
					<Skeleton className="size-10 rounded-lg" />
					<div className="flex-1 space-y-2">
						<Skeleton className="h-5 w-32" />
						<Skeleton className="size-48" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

/**
 * Skeleton for the settings hub page (grid of nav cards).
 */
export function SettingsHubPageSkeleton() {
	return (
		<div className="space-y-6">
			<PageActionBarSkeleton />

			<div className="grid gap-4 md:grid-cols-2">
				<SettingsNavCardSkeleton />
				<SettingsNavCardSkeleton />
				<SettingsNavCardSkeleton />
				<SettingsNavCardSkeleton />
			</div>
		</div>
	);
}

/**
 * Skeleton for the merchant settings page (tabs + form cards).
 */
export function MerchantSettingsPageSkeleton() {
	return (
		<div className="space-y-6">
			<PageActionBarSkeleton withTabs />

			<div className="mt-6 space-y-6">
				<CardFormSkeleton rows={4} />
				<CardFormSkeleton rows={3} />
			</div>
		</div>
	);
}

/**
 * Skeleton for a status card (used in payments/subscription).
 */
function StatusCardSkeleton() {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="space-y-2">
						<Skeleton className="h-5 w-24" />
						<Skeleton className="size-40" />
					</div>
					<Skeleton className="h-6 w-20 rounded-full" />
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-4 w-24" />
					</div>
					<div className="flex items-center justify-between">
						<Skeleton className="h-4 w-28" />
						<Skeleton className="h-4 w-20" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

/**
 * Skeleton for the payments settings page.
 */
export function PaymentsPageSkeleton() {
	return (
		<div className="space-y-6">
			<PageActionBarSkeleton />

			<div className="space-y-6">
				<StatusCardSkeleton />

				{/* Action buttons */}
				<div className="flex gap-3">
					<Skeleton className="h-10 w-40" />
					<Skeleton className="h-10 w-32" />
				</div>
			</div>
		</div>
	);
}

/**
 * Skeleton for the subscription settings page.
 */
export function SubscriptionSettingsPageSkeleton() {
	return (
		<div className="space-y-6">
			<PageActionBarSkeleton />

			<div className="space-y-6">
				{/* Current plan card */}
				<StatusCardSkeleton />

				{/* Plan selection or upgrade section */}
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-36" />
						<Skeleton className="mt-1 h-4 w-56" />
					</CardHeader>
					<CardContent>
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-3 rounded-lg border p-4">
								<Skeleton className="h-5 w-20" />
								<Skeleton className="h-8 w-24" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-3/4" />
							</div>
							<div className="space-y-3 rounded-lg border p-4">
								<Skeleton className="h-5 w-24" />
								<Skeleton className="h-8 w-28" />
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-3/4" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
