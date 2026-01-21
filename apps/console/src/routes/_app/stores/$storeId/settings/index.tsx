import { Switch, VStack } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
	SettingsRowGroup,
	SettingsRowItem,
} from "@/components/ui/settings-row";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { StoreDetailContentSkeleton } from "@/features/stores/components/skeletons";
import { StoreDetailsForm } from "@/features/stores/components/store-details-form";
import { useTRPC, useTRPCClient } from "@/lib/trpc";

export const Route = createFileRoute("/_app/stores/$storeId/settings/")({
	component: StoreSettingsDetailsPage,
	errorComponent: ConsoleError,
});

function StoreSettingsDetailsPage() {
	const store = useStore();
	const storeId = Route.useParams().storeId;

	return (
		<Suspense fallback={<StoreDetailContentSkeleton />}>
			<StoreSettingsDetailsContent storeId={storeId} store={store} />
		</Suspense>
	);
}

interface StoreSettingsDetailsContentProps {
	storeId: string;
	store: ReturnType<typeof useStore>;
}

function StoreSettingsDetailsContent({
	storeId,
	store,
}: StoreSettingsDetailsContentProps) {
	const { t } = useTranslation("stores");
	const { t: tToasts } = useTranslation("toasts");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();

	const toggleActiveMutation = useMutation({
		...trpc.store.toggleActive.mutationOptions(),
		mutationFn: async (input: { storeId: string; isActive: boolean }) =>
			trpcClient.store.toggleActive.mutate(input),
		onSuccess: (updatedStore) => {
			queryClient.invalidateQueries({
				queryKey: trpc.store.list.queryKey(),
			});
			toast.success(
				updatedStore.isActive
					? tToasts("success.storeActivated")
					: tToasts("success.storeDeactivated"),
			);
		},
		onError: () => {
			toast.error(tToasts("error.updateStoreStatus"));
		},
	});

	const handleToggleActive = (checked: boolean) => {
		toggleActiveMutation.mutate({ storeId, isActive: checked });
	};

	return (
		<VStack layerStyle="settingsContent">
			{/* Store Status Toggle */}
			<SettingsRowGroup title={t("labels.storeStatus")}>
				<SettingsRowItem
					label={t("labels.storeActive")}
					description={t("descriptions.storeStatus")}
					action={
						<Switch.Root
							checked={store.isActive}
							onCheckedChange={(e) => handleToggleActive(e.checked)}
							disabled={toggleActiveMutation.isPending}
							colorPalette="red"
						>
							<Switch.HiddenInput />
							<Switch.Control />
						</Switch.Root>
					}
				/>
			</SettingsRowGroup>

			{/* Store Details Form */}
			<StoreDetailsForm
				store={store}
				merchantId={store.merchantId}
				skipWrapper
			/>
		</VStack>
	);
}
