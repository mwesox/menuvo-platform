import type { Merchant } from "@menuvo/db/schema";
import type { AppRouter } from "@menuvo/trpc";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	Outlet,
	useLocation,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { TRPCClient } from "@trpc/client";
import { Toaster } from "sonner";
import { ConsoleLayout } from "@/components/layout/console-layout";
import { ConsoleError } from "@/features/components/console-error";

export interface RouterContext {
	queryClient: QueryClient;
	trpcClient: TRPCClient<AppRouter>;
	merchant?: Merchant;
	merchantId?: string;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	// No beforeLoad - pure client-side navigation
	// Auth checks happen in components using React Query hooks
	component: RootComponent,
	errorComponent: ConsoleError,
});

function RootComponent() {
	const location = useLocation();
	const isOnboarding = location.pathname === "/onboarding";

	// Onboarding route doesn't need the console layout (it has its own full-screen layout)
	if (isOnboarding) {
		return (
			<>
				<Outlet />
				<Toaster position="bottom-right" />
				<TanStackRouterDevtools position="bottom-left" />
			</>
		);
	}

	return (
		<>
			<ConsoleLayout />
			<Toaster position="bottom-right" />
			<TanStackRouterDevtools position="bottom-left" />
		</>
	);
}
