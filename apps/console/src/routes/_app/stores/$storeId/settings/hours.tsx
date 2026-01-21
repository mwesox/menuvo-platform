import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { StoreDetailContentSkeleton } from "@/features/stores/components/skeletons";
import { StoreHoursForm } from "@/features/stores/components/store-hours-form";

export const Route = createFileRoute("/_app/stores/$storeId/settings/hours")({
	component: StoreSettingsHoursPage,
	errorComponent: ConsoleError,
});

function StoreSettingsHoursPage() {
	const store = useStore();

	return (
		<Suspense fallback={<StoreDetailContentSkeleton />}>
			<StoreHoursForm storeId={store.id} />
		</Suspense>
	);
}
