import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { StoreDetailContentSkeleton } from "@/features/stores/components/skeletons";
import { StoreClosuresForm } from "@/features/stores/components/store-closures-form";

export const Route = createFileRoute("/_app/stores/$storeId/settings/closures")(
	{
		component: StoreSettingsClosuresPage,
		errorComponent: ConsoleError,
	},
);

function StoreSettingsClosuresPage() {
	const store = useStore();

	return (
		<Suspense fallback={<StoreDetailContentSkeleton />}>
			<StoreClosuresForm storeId={store.id} />
		</Suspense>
	);
}
