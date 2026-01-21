import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { StoreDetailContentSkeleton } from "@/features/stores/components/skeletons";
import { StoreOrderTypesForm } from "@/features/stores/components/store-order-types-form";

export const Route = createFileRoute(
	"/_app/stores/$storeId/settings/order-types",
)({
	component: StoreSettingsOrderTypesPage,
	errorComponent: ConsoleError,
});

function StoreSettingsOrderTypesPage() {
	const store = useStore();

	return (
		<Suspense fallback={<StoreDetailContentSkeleton />}>
			<StoreOrderTypesForm storeId={store.id} />
		</Suspense>
	);
}
