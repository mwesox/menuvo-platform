import { Edit, MoreVertical, QrCode, Tag, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardHeader } from "@/components/ui/card.tsx";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Switch } from "@/components/ui/switch.tsx";
import type { ServicePoint } from "@/db/schema.ts";

interface ServicePointCardProps {
	servicePoint: ServicePoint;
	onEdit: (servicePoint: ServicePoint) => void;
	onViewQR: (servicePoint: ServicePoint) => void;
	onToggleActive: (id: number, isActive: boolean) => void;
	onDelete: (id: number) => void;
}

export function ServicePointCard({
	servicePoint,
	onEdit,
	onViewQR,
	onToggleActive,
	onDelete,
}: ServicePointCardProps) {
	const { t } = useTranslation("servicePoints");
	const attributeCount = servicePoint.attributes
		? Object.keys(servicePoint.attributes).length
		: 0;

	return (
		<Card className="overflow-hidden transition-shadow hover:shadow-md">
			<CardHeader className="pb-3">
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-start gap-3">
						<button
							type="button"
							onClick={() => onViewQR(servicePoint)}
							className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors hover:bg-primary/20"
						>
							<QrCode className="h-6 w-6 text-primary" />
						</button>
						<div className="space-y-1">
							<div className="flex items-center gap-2">
								<h3 className="font-semibold leading-tight">
									{servicePoint.name}
								</h3>
								<Badge
									variant={servicePoint.isActive ? "default" : "secondary"}
									className="shrink-0"
								>
									{servicePoint.isActive
										? t("labels.active")
										: t("labels.inactive")}
								</Badge>
							</div>
							<p className="font-mono text-sm text-muted-foreground">
								/{servicePoint.code}
							</p>
						</div>
					</div>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="shrink-0">
								<MoreVertical className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onClick={() => onViewQR(servicePoint)}>
								<QrCode className="mr-2 h-4 w-4" />
								{t("labels.viewQrCode")}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => onEdit(servicePoint)}>
								<Edit className="mr-2 h-4 w-4" />
								{t("buttons.edit")}
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => onDelete(servicePoint.id)}
								className="text-destructive focus:text-destructive"
							>
								<Trash2 className="mr-2 h-4 w-4" />
								{t("buttons.delete")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardHeader>

			<CardContent className="space-y-3 pt-0">
				<div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
					{servicePoint.type && (
						<div className="flex items-center gap-1">
							<Tag className="h-3.5 w-3.5" />
							<span>{servicePoint.type}</span>
						</div>
					)}
					{attributeCount > 0 && (
						<span className="text-xs">
							{attributeCount}{" "}
							{attributeCount > 1 ? t("misc.attributes") : t("misc.attribute")}
						</span>
					)}
				</div>

				{servicePoint.description && (
					<p className="line-clamp-2 text-sm text-muted-foreground">
						{servicePoint.description}
					</p>
				)}

				<div className="flex items-center justify-between border-t pt-3">
					<div className="flex items-center gap-2 text-sm">
						<span className="text-muted-foreground">
							{servicePoint.isActive
								? t("labels.active")
								: t("labels.inactive")}
						</span>
						<Switch
							checked={servicePoint.isActive}
							onCheckedChange={(checked) =>
								onToggleActive(servicePoint.id, checked)
							}
						/>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => onViewQR(servicePoint)}
					>
						<QrCode className="mr-2 h-4 w-4" />
						{t("labels.qrCode")}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
