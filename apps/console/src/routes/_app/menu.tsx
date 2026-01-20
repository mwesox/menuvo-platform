/**
 * Redirect route for backward compatibility.
 * Redirects /menu?storeId=xxx to /stores/xxx/menu
 */
import { createFileRoute, Navigate } from "@tanstack/react-router";
import { z } from "zod/v4";

export const Route = createFileRoute("/_app/menu")({
	validateSearch: z.object({
		storeId: z.string().optional(),
	}),
	component: MenuRedirect,
});

function MenuRedirect() {
	const { storeId } = Route.useSearch();

	if (storeId) {
		return <Navigate to="/stores/$storeId/menu" params={{ storeId }} replace />;
	}

	// No storeId - redirect to dashboard which handles single-store auto-redirect
	return <Navigate to="/" replace />;
}
