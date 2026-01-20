import type { AppRouter } from "@menuvo/api/trpc";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
	Skeleton,
} from "@menuvo/ui";
import { useQuery } from "@tanstack/react-query";
import {
	Outlet,
	useNavigate,
	useRouterState,
	useSearch,
} from "@tanstack/react-router";
import type { inferRouterOutputs } from "@trpc/server";
import { Suspense, useCallback } from "react";
import { useTRPC } from "@/lib/trpc";
import { ConsoleHeader } from "./console-header";
import { Footer } from "./footer";
import { AppSidebar } from "./sidebar";

type RouterOutput = inferRouterOutputs<AppRouter>;
type StoreList = RouterOutput["store"]["list"];

function ConsoleHeaderWrapper() {
	const navigate = useNavigate();
	const routerState = useRouterState();
	const search = useSearch({ strict: false }) as { storeId?: string };
	const trpc = useTRPC();

	// Use tRPC v11 best practice: useTRPC() + queryOptions()
	const { data: storesData, isLoading } = useQuery(
		trpc.store.list.queryOptions(),
	);
	const stores = (storesData ?? []) as StoreList;

	// Auto-select first store if only one exists
	const effectiveStoreId =
		search.storeId ??
		(stores && stores.length === 1 ? stores[0]?.id : undefined);

	const selectStore = useCallback(
		(storeId: string) => {
			// Update storeId in URL while staying on current page
			navigate({
				to: routerState.location.pathname,
				search: { ...search, storeId },
			});
		},
		[navigate, routerState.location.pathname, search],
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
