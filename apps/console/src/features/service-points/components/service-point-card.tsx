import {
	Card,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Switch,
} from "@menuvo/ui";
import { Edit, MoreVertical, QrCode, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ServicePoint } from "../types.ts";

interface ServicePointCardProps {
	servicePoint: ServicePoint;
	onEdit: (servicePoint: ServicePoint) => void;
	onViewQR: (servicePoint: ServicePoint) => void;
	onToggleActive: (id: string, isActive: boolean) => void;
	onDelete: (id: string) => void;
}

export function ServicePointCard({
	servicePoint,
	onEdit,
	onViewQR,
	onToggleActive,
	onDelete,
}: ServicePointCardProps) {
	const { t } = useTranslation("servicePoints");

	return (
		<Card className="overflow-hidden transition-shadow hover:shadow-md">
			<div className="flex items-center gap-3 p-3">
				{/* QR Code Icon - clickable */}
				<button
					type="button"
					onClick={() => onViewQR(servicePoint)}
					className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors hover:bg-primary/20"
				>
					<QrCode className="size-5 text-primary" />
				</button>

				{/* Name + Description */}
				<div className="min-w-0 flex-1">
					<h3 className="truncate font-medium">{servicePoint.name}</h3>
					{servicePoint.description && (
						<p className="truncate text-muted-foreground text-sm">
							{servicePoint.description}
						</p>
					)}
				</div>

				{/* Toggle */}
				<Switch
					checked={servicePoint.isActive}
					onCheckedChange={(checked) =>
						onToggleActive(servicePoint.id, checked)
					}
				/>

				{/* Actions Menu */}
				<DropdownMenu>
					<DropdownMenuTrigger className="-me-1 rounded p-1 hover:bg-muted">
						<MoreVertical className="size-4 text-muted-foreground" />
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => onViewQR(servicePoint)}>
							<QrCode className="me-2 size-4" />
							{t("labels.viewQrCode")}
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => onEdit(servicePoint)}>
							<Edit className="me-2 size-4" />
							{t("buttons.edit")}
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => onDelete(servicePoint.id)}
							className="text-destructive focus:text-destructive"
						>
							<Trash2 className="me-2 size-4" />
							{t("buttons.delete")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</Card>
	);
}
