import { useSuspenseQuery } from "@tanstack/react-query";
import { Outlet, useNavigate, useSearch } from "@tanstack/react-router";
import { Suspense, useCallback } from "react";
import { storeQueries } from "@/features/console/stores/queries";
import { ConsoleHeader } from "./console-header";
import { Footer } from "./footer";
import { MobileSidebar, Sidebar } from "./sidebar";

function ConsoleHeaderWrapper() {
	const navigate = useNavigate();
	const search = useSearch({ strict: false }) as { storeId?: number };
	const { data: stores } = useSuspenseQuery(storeQueries.list());

	// Auto-select first store if only one exists
	const effectiveStoreId =
		search.storeId ?? (stores.length === 1 ? stores[0].id : undefined);

	const selectStore = useCallback(
		(storeId: number) => {
			// Navigate to menu page with the selected store
			// This is the primary use case for store selection
			navigate({
				to: "/console/menu",
				search: { storeId },
			});
		},
		[navigate],
	);

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
			<main className="flex-1 p-4 lg:p-6 lg:pt-4">
				<Outlet />
			</main>
			<Footer />
		</>
	);
}

export function ConsoleLayout() {
	return (
		<div className="flex min-h-screen bg-background">
			<Sidebar />
			<div className="flex flex-1 flex-col">
				{/* Mobile header with hamburger */}
				<header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4 lg:hidden">
					<MobileSidebar />
					<div className="flex-1" />
				</header>

				{/* Main content with global header */}
				<Suspense
					fallback={
						<div className="flex-1 p-4 lg:p-6 lg:pt-4">
							<div className="animate-pulse h-12 bg-muted rounded" />
						</div>
					}
				>
					<ConsoleContent />
				</Suspense>
			</div>
		</div>
	);
}
