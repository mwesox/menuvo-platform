import { Button, Dialog, Portal } from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useTRPC, useTRPCClient } from "@/lib/trpc";

interface DeleteStoreDialogProps {
	storeId: string;
	open: boolean;
	onOpenChange: (e: { open: boolean }) => void;
}

export function DeleteStoreDialog({
	storeId,
	open,
	onOpenChange,
}: DeleteStoreDialogProps) {
	const { t: tCommon } = useTranslation("common");
	const { t: tToasts } = useTranslation("toasts");
	const { t } = useTranslation("stores");
	const navigate = useNavigate();
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		...trpc.store.delete.mutationOptions(),
		mutationFn: async (input: { storeId: string }) =>
			trpcClient.store.delete.mutate(input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.store.list.queryKey(),
			});
			toast.success(tToasts("success.storeDeleted"));
			onOpenChange({ open: false });
			navigate({ to: "/stores" });
		},
		onError: () => {
			toast.error(tToasts("error.deleteStore"));
		},
	});

	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange} role="alertdialog">
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>{t("dialogs.deleteTitle")}</Dialog.Title>
							<Dialog.Description>
								{t("dialogs.deleteDescription")}
							</Dialog.Description>
						</Dialog.Header>
						<Dialog.Footer>
							<Button
								variant="outline"
								onClick={() => onOpenChange({ open: false })}
							>
								{tCommon("buttons.cancel")}
							</Button>
							<Button
								colorPalette="red"
								onClick={() => deleteMutation.mutate({ storeId })}
								loading={deleteMutation.isPending}
								loadingText={tCommon("states.deleting")}
							>
								{tCommon("buttons.delete")}
							</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
}
