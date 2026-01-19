import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod/v4";
import { MenuTabs } from "@/features/menu/components/menu-tabs";
import { ImportWizard } from "@/features/menu-import/components/import-wizard";
import { trpcUtils } from "@/lib/trpc";

const searchSchema = z.object({
	storeId: z.string().optional(),
});

export const Route = createFileRoute("/_app/menu/import")({
	validateSearch: searchSchema,
	loader: async () => {
		const stores = await trpcUtils.store.list.ensureData();
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
		navigate({ to: "/menu" });
		return null;
	}

	const handleClose = () => {
		navigate({
			to: "/menu",
			search: { storeId: effectiveStoreId },
		});
	};

	return (
		<div className="space-y-6">
			<MenuTabs storeId={effectiveStoreId} />
			<ImportWizard storeId={effectiveStoreId} onClose={handleClose} />
		</div>
	);
}
