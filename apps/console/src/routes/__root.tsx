import type { AppRouter } from "@menuvo/api/trpc";
import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import type { TRPCClient } from "@trpc/client";
import type { inferRouterOutputs } from "@trpc/server";
import { Toaster } from "sonner";
import { ConsoleError } from "@/features/components/console-error";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Merchant = NonNullable<RouterOutput["auth"]["getMerchantOrNull"]>;

export interface RouterContext {
	queryClient: QueryClient;
	trpcClient: TRPCClient<AppRouter>;
	merchant?: Merchant;
	merchantId?: string;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootComponent,
	errorComponent: ConsoleError,
});

function RootComponent() {
	return (
		<>
			<Outlet />
			<Toaster position="bottom-right" />
			<TanStackRouterDevtools position="bottom-left" />
		</>
	);
}
