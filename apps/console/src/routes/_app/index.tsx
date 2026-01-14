import { Card, CardContent, CardHeader, CardTitle, Skeleton } from "@menuvo/ui";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShoppingCart, Store, UtensilsCrossed } from "lucide-react";
import { useEffect } from "react";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_app/")({
	component: DashboardPage,
});

function DashboardPage() {
	const navigate = useNavigate();
	const trpc = useTRPC();

	// Use tRPC v11 best practice: useTRPC() + queryOptions()
	const { data: merchant, isLoading } = useQuery(
		trpc.auth.getMerchantOrNull.queryOptions(),
	);

	// Debug logging for auth flow
	useEffect(() => {
		console.log("[dashboard] Auth state:", {
			isLoading,
			hasMerchant: !!merchant,
			merchantId: merchant?.id || "(none)",
			cookies: document.cookie,
		});
	}, [isLoading, merchant]);

	// Redirect to onboarding if no merchant (after loading completes)
	useEffect(() => {
		if (!isLoading && !merchant) {
			console.log("[dashboard] No merchant found, redirecting to /onboarding");
			navigate({ to: "/onboarding" });
		}
	}, [merchant, isLoading, navigate]);

	// Show loading state while checking auth
	if (isLoading) {
		return (
			<div>
				<Skeleton className="mb-6 h-8 w-48" />
				<div className="grid gap-4 md:grid-cols-3">
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-24" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-16" />
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-24" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-16" />
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-24" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-16" />
						</CardContent>
					</Card>
				</div>
			</div>
		);
	}

	// Don't render if redirecting
	if (!merchant) {
		return null;
	}

	return (
		<div>
			<h1 className="mb-6 font-bold text-2xl tracking-tight">Dashboard</h1>

			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Total Stores</CardTitle>
						<Store className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">0</div>
						<p className="text-muted-foreground text-xs">
							Manage your locations
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Menu Items</CardTitle>
						<UtensilsCrossed className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">0</div>
						<p className="text-muted-foreground text-xs">
							Across all categories
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Categories</CardTitle>
						<ShoppingCart className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">0</div>
						<p className="text-muted-foreground text-xs">Menu sections</p>
					</CardContent>
				</Card>
			</div>

			<div className="mt-8">
				<Card>
					<CardHeader>
						<CardTitle>Getting Started</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-sm">
							Welcome to Menuvo! Start by creating your first store and adding
							menu items.
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
