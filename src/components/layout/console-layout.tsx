import { Outlet } from "@tanstack/react-router";
import { Footer } from "./footer";
import { MobileSidebar, Sidebar } from "./sidebar";

export function ConsoleLayout() {
	return (
		<div className="flex min-h-screen bg-background">
			<Sidebar />
			<div className="flex flex-1 flex-col">
				<header className="flex h-14 items-center gap-4 border-b border-border bg-card px-4 lg:px-6">
					<MobileSidebar />
					<div className="flex-1" />
				</header>
				<main className="flex-1 p-4 lg:p-6">
					<Outlet />
				</main>
				<Footer />
			</div>
		</div>
	);
}
