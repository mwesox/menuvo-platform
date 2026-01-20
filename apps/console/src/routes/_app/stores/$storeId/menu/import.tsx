import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { MenuTabs } from "@/features/menu/components/menu-tabs";
import { ImportWizard } from "@/features/menu-import/components/import-wizard";

export const Route = createFileRoute("/_app/stores/$storeId/menu/import")({
	component: ImportPage,
	errorComponent: ConsoleError,
});

function ImportPage() {
	const store = useStore();
	const navigate = useNavigate();

	const handleClose = () => {
		navigate({
			to: "/stores/$storeId/menu",
			params: { storeId: store.id },
		});
	};

	return (
		<div className="space-y-6">
			<MenuTabs />
			<ImportWizard storeId={store.id} onClose={handleClose} />
		</div>
	);
}
