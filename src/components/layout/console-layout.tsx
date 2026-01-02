import { Outlet } from "@tanstack/react-router";
import { Suspense } from "react";
import { useStoreSelection } from "@/features/console/stores/contexts/store-selection-context";
import { ConsoleHeader } from "./console-header";
import { Footer } from "./footer";
import { MobileSidebar, Sidebar } from "./sidebar";

function ConsoleHeaderWrapper() {
	const storeContext = useStoreSelection();

	return (
		<ConsoleHeader
			storeId={storeContext.selectedStoreId}
			onStoreChange={storeContext.selectStore}
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
