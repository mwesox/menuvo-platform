import type { ServicePoint } from "@menuvo/db/schema";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@menuvo/ui";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { ServicePointForm } from "./service-point-form.tsx";

interface ServicePointDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	storeId: string;
	servicePoint?: ServicePoint;
}

export function ServicePointDialog({
	open,
	onOpenChange,
	storeId,
	servicePoint,
}: ServicePointDialogProps) {
	const { t } = useTranslation("servicePoints");
	const isEditing = !!servicePoint;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex max-h-[85vh] max-w-lg flex-col">
				<DialogHeader>
					<DialogTitle>
						{isEditing
							? t("titles.editServicePoint")
							: t("titles.createServicePoint")}
					</DialogTitle>
					<DialogDescription>
						{isEditing
							? t("descriptions.editDescription")
							: t("descriptions.createDescription")}
					</DialogDescription>
				</DialogHeader>
				<div className="-mx-6 flex-1 overflow-y-auto px-6 pb-1">
					<Suspense
						fallback={
							<div className="py-8 text-center">{t("misc.loading")}</div>
						}
					>
						<ServicePointForm
							storeId={storeId}
							servicePoint={servicePoint}
							onSuccess={() => onOpenChange(false)}
							onCancel={() => onOpenChange(false)}
						/>
					</Suspense>
				</div>
			</DialogContent>
		</Dialog>
	);
}
