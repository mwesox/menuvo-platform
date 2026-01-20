import { Card, CardContent, CardHeader, Skeleton } from "@menuvo/ui";
import {
	CardFormSkeleton,
	PageActionBarSkeleton,
} from "@/components/layout/skeletons";

/**
 * Skeleton for a status card (used in payments).
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
 * @deprecated Use inline skeleton in settings index route
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
 * Skeleton for the merchant settings page (tabs + form cards).
 * @deprecated Use inline skeleton in settings index route
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
 * Skeleton for the settings hub page (grid of nav cards).
 * @deprecated Settings now uses sidebar layout
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
 * Skeleton for a settings navigation card.
 * @deprecated Settings now uses sidebar layout
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
