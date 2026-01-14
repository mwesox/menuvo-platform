import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
	Skeleton,
} from "@menuvo/ui";
import { useQuery } from "@tanstack/react-query";
import { Outlet, useNavigate, useSearch } from "@tanstack/react-router";
import { Suspense, useCallback } from "react";
import { useTRPC } from "@/lib/trpc";
import { ConsoleHeader } from "./console-header";
import { Footer } from "./footer";
import { AppSidebar } from "./sidebar";

function ConsoleHeaderWrapper() {
	const navigate = useNavigate();
	const search = useSearch({ strict: false }) as { storeId?: string };
	const trpc = useTRPC();

	// Use tRPC v11 best practice: useTRPC() + queryOptions()
	const { data: stores, isLoading } = useQuery(trpc.store.list.queryOptions());

	// Auto-select first store if only one exists
	const effectiveStoreId =
		search.storeId ??
		(stores && stores.length === 1 ? stores[0]?.id : undefined);

	const selectStore = useCallback(
		(storeId: string) => {
			// Navigate to menu page with the selected store
			// This is the primary use case for store selection
			navigate({
				to: "/menu",
				search: { storeId },
			});
		},
		[navigate],
	);

	// Show loading skeleton while stores are loading
	if (isLoading || !stores) {
		return (
			<div className="h-14 bg-card px-4">
				<div className="flex h-full items-center gap-4">
					<Skeleton className="h-8 w-32" />
					<div className="flex-1" />
					<Skeleton className="h-9 w-40" />
				</div>
			</div>
		);
	}

	return (
		<ConsoleHeader
			stores={stores}
			storeId={effectiveStoreId}
			onStoreChange={selectStore}
		/>
	);
}

function ConsoleContent() {
	return (
		<>
			<ConsoleHeaderWrapper />
			<main className="flex-1 p-4 md:p-6 md:pt-4">
				<Outlet />
			</main>
			<Footer />
		</>
	);
}

export function ConsoleLayout() {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				{/* Mobile header with hamburger */}
				<header className="flex h-14 items-center gap-4 border-border border-b bg-card px-4 md:hidden">
					<SidebarTrigger />
					<div className="flex-1" />
				</header>

				{/* Main content with global header */}
				<Suspense
					fallback={
						<div className="flex-1 p-4 md:p-6 md:pt-4">
							<div className="h-12 animate-pulse rounded bg-muted" />
						</div>
					}
				>
					<ConsoleContent />
				</Suspense>
			</SidebarInset>
		</SidebarProvider>
	);
}
