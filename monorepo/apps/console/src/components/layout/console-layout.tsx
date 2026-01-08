import { Outlet } from "@tanstack/react-router";

export function ConsoleLayout() {
	return (
		<div className="min-h-screen bg-background">
			<main className="container mx-auto max-w-6xl px-4 py-8">
				<Outlet />
			</main>
		</div>
	);
}
