import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Button,
} from "@menuvo/ui";
import { CheckCircle, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ServicePoint } from "../types";
import type { ZoneGroup } from "../utils/group-by-zone";
import { getZoneDisplayName, isUnassignedZone } from "../utils/group-by-zone";
import { ServicePointGrid } from "./service-point-grid";

interface ZoneAccordionProps {
	zoneGroups: ZoneGroup[];
	onEdit: (servicePoint: ServicePoint) => void;
	onViewQR: (servicePoint: ServicePoint) => void;
	onToggleActive: (id: string, isActive: boolean) => void;
	onDelete: (id: string) => void;
	onActivateZone: (zone: string) => void;
	onDeactivateZone: (zone: string) => void;
	isZoneTogglePending?: boolean;
}

export function ZoneAccordion({
	zoneGroups,
	onEdit,
	onViewQR,
	onToggleActive,
	onDelete,
	onActivateZone,
	onDeactivateZone,
	isZoneTogglePending,
}: ZoneAccordionProps) {
	const { t } = useTranslation("servicePoints");
	// Default all zones to expanded
	const defaultExpanded = zoneGroups.map((g) => g.zone);

	return (
		<Accordion
			type="multiple"
			defaultValue={defaultExpanded}
			className="space-y-3"
		>
			{zoneGroups.map((group) => {
				const displayName = getZoneDisplayName(
					group.zone,
					t("zones.unassigned"),
				);
				const isUnassigned = isUnassignedZone(group.zone);

				return (
					<AccordionItem
						key={group.zone}
						value={group.zone}
						className="rounded-lg border bg-card"
					>
						<div className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-3">
							<AccordionTrigger className="flex-1 hover:no-underline [&[data-state=open]>svg]:rotate-180">
								<div className="flex items-center gap-2">
									<span className="font-medium">{displayName}</span>
									<span className="text-muted-foreground text-xs sm:text-sm">
										{t("zones.activeCount", {
											active: group.activeCount,
											total: group.totalCount,
										})}
									</span>
								</div>
							</AccordionTrigger>

							{/* Actions OUTSIDE trigger to avoid nested buttons */}
							{!isUnassigned && (
								<div className="flex items-center gap-1">
									<Button
										variant="ghost"
										size="icon"
										onClick={() => onActivateZone(group.zone)}
										disabled={
											isZoneTogglePending ||
											group.activeCount === group.totalCount
										}
										className="size-7"
										title={t("zones.activateAll")}
									>
										<CheckCircle className="size-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => onDeactivateZone(group.zone)}
										disabled={isZoneTogglePending || group.activeCount === 0}
										className="size-7"
										title={t("zones.deactivateAll")}
									>
										<XCircle className="size-4" />
									</Button>
								</div>
							)}
						</div>
						<AccordionContent className="px-3 pb-3 sm:px-4 sm:pb-4">
							<ServicePointGrid
								servicePoints={group.servicePoints}
								onEdit={onEdit}
								onViewQR={onViewQR}
								onToggleActive={onToggleActive}
								onDelete={onDelete}
							/>
						</AccordionContent>
					</AccordionItem>
				);
			})}
		</Accordion>
	);
}
