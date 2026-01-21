import { Button, Dialog, Portal } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";

interface DeleteConfirmationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}

export function DeleteConfirmationDialog({
	open,
	onOpenChange,
	onConfirm,
}: DeleteConfirmationDialogProps) {
	const { t } = useTranslation("servicePoints");

	return (
		<Dialog.Root
			open={open}
			onOpenChange={(e) => onOpenChange(e.open)}
			role="alertdialog"
		>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content>
						<Dialog.Header>
							<Dialog.Title>{t("titles.deleteServicePoint")}</Dialog.Title>
							<Dialog.Description>
								{t("descriptions.deleteDescription")}
							</Dialog.Description>
						</Dialog.Header>
						<Dialog.Footer>
							<Dialog.ActionTrigger asChild>
								<Button variant="outline">{t("buttons.cancel")}</Button>
							</Dialog.ActionTrigger>
							<Button onClick={onConfirm} colorPalette="red">
								{t("buttons.delete")}
							</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
}
