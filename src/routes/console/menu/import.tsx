import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { requireMerchant } from "@/features/console/auth/server/merchant.functions";
import { ImportWizard } from "@/features/console/menu-import/components/import-wizard";
import { storeQueries } from "@/features/console/stores/queries";

const searchSchema = z.object({
	storeId: z.number().optional(),
});

export const Route = createFileRoute("/console/menu/import")({
	validateSearch: searchSchema,
	beforeLoad: async () => requireMerchant(),
	loader: async ({ context }) => {
		const stores = await context.queryClient.ensureQueryData(
			storeQueries.list(),
		);
		return { stores };
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { storeId } = Route.useSearch();
	const { stores } = Route.useLoaderData();
	const navigate = useNavigate();

	// Use provided storeId or auto-select if single store
	const effectiveStoreId =
		storeId ?? (stores.length === 1 ? stores[0]?.id : undefined);

	if (!effectiveStoreId) {
		// Redirect to menu page if no store selected
		navigate({ to: "/console/menu" });
		return null;
	}

	const handleClose = () => {
		navigate({
			to: "/console/menu",
			search: { storeId: effectiveStoreId },
		});
	};

	return <ImportWizard storeId={effectiveStoreId} onClose={handleClose} />;
}
