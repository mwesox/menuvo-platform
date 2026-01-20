import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@menuvo/ui";
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
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t("titles.deleteServicePoint")}</AlertDialogTitle>
					<AlertDialogDescription>
						{t("descriptions.deleteDescription")}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{t("buttons.cancel")}</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{t("buttons.delete")}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
