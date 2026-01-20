import { SidebarInset, SidebarProvider, SidebarTrigger } from "@menuvo/ui";
import { Outlet } from "@tanstack/react-router";
import { Suspense } from "react";
import { StoreSelectionProvider } from "@/contexts/store-selection-context";
import { ConsoleHeader } from "./console-header";
import { Footer } from "./footer";
import { AppSidebar } from "./sidebar";

function ConsoleContent() {
	return (
		<>
			<ConsoleHeader />
			<main className="flex-1 p-4 md:p-6 md:pt-4">
				<Outlet />
			</main>
			<Footer />
		</>
	);
}

export function ConsoleLayout() {
	return (
		<StoreSelectionProvider>
			<SidebarProvider>
				<AppSidebar />
				<SidebarInset>
					{/* Mobile header with hamburger */}
					<header className="flex h-14 items-center gap-4 border-border border-b bg-card px-4 lg:hidden">
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
		</StoreSelectionProvider>
	);
}
