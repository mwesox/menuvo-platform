/**
 * Redirect route for backward compatibility.
 * Redirects /orders?storeId=xxx to /stores/xxx/orders
 */
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { z } from "zod/v4";

export const Route = createFileRoute("/_app/orders")({
	validateSearch: z.object({
		storeId: z.string().optional(),
	}),
	component: OrdersRedirect,
});

function OrdersRedirect() {
	const { storeId } = Route.useSearch();

	if (storeId) {
		return (
			<Navigate to="/stores/$storeId/orders" params={{ storeId }} replace />
		);
	}

	// No storeId - redirect to dashboard which handles single-store auto-redirect
	return <Navigate to="/" replace />;
}
