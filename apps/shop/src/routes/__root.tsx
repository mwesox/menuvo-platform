import type { AppRouter } from "@menuvo/trpc";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { TRPCClient } from "@trpc/client";
import { Toaster } from "sonner";

export interface RouterContext {
	queryClient: QueryClient;
	trpcClient: TRPCClient<AppRouter>;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootComponent,
});

function RootComponent() {
	return (
		<>
			<Outlet />
			<Toaster position="bottom-right" />
		</>
	);
}
