/**
 * Redirect route for backward compatibility.
 * Redirects /kitchen?storeId=xxx to /stores/xxx/kitchen
 */
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { z } from "zod/v4";

export const Route = createFileRoute("/_app/kitchen")({
	validateSearch: z.object({
		storeId: z.string().optional(),
	}),
	component: KitchenRedirect,
});

function KitchenRedirect() {
	const { storeId } = Route.useSearch();

	if (storeId) {
		return (
			<Navigate to="/stores/$storeId/kitchen" params={{ storeId }} replace />
		);
	}

	// No storeId - redirect to dashboard which handles single-store auto-redirect
	return <Navigate to="/" replace />;
}
