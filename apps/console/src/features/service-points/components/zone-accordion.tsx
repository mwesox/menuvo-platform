import {
	Accordion,
	Box,
	Button,
	HStack,
	Icon,
	Text,
	VStack,
} from "@chakra-ui/react";
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
		<VStack gap="3" align="stretch">
			<Accordion.Root multiple defaultValue={defaultExpanded}>
				{zoneGroups.map((group) => {
					const displayName = getZoneDisplayName(
						group.zone,
						t("zones.unassigned"),
					);
					const isUnassigned = isUnassignedZone(group.zone);

					return (
						<Accordion.Item key={group.zone} value={group.zone}>
							<Box rounded="lg" borderWidth="1px" bg="card">
								<HStack
									gap="2"
									align="center"
									px={{ base: "3", sm: "4" }}
									py={{ base: "2", sm: "3" }}
								>
									<Accordion.ItemTrigger
										flex="1"
										_hover={{ textDecoration: "none" }}
									>
										<HStack gap="2" align="center" flex="1">
											<Text fontWeight="medium">{displayName}</Text>
											<Text
												color="fg.muted"
												textStyle={{ base: "xs", sm: "sm" }}
											>
												{t("zones.activeCount", {
													active: group.activeCount,
													total: group.totalCount,
												})}
											</Text>
										</HStack>
										<Accordion.ItemIndicator />
									</Accordion.ItemTrigger>

									{/* Actions OUTSIDE trigger to avoid nested buttons */}
									{!isUnassigned && (
										<HStack gap="1" align="center">
											<Button
												variant="ghost"
												size="sm"
												w="7"
												h="7"
												p="0"
												onClick={() => onActivateZone(group.zone)}
												disabled={
													isZoneTogglePending ||
													group.activeCount === group.totalCount
												}
												title={t("zones.activateAll")}
											>
												<Icon w="4" h="4">
													<CheckCircle />
												</Icon>
											</Button>
											<Button
												variant="ghost"
												size="sm"
												w="7"
												h="7"
												p="0"
												onClick={() => onDeactivateZone(group.zone)}
												disabled={
													isZoneTogglePending || group.activeCount === 0
												}
												title={t("zones.deactivateAll")}
											>
												<Icon w="4" h="4">
													<XCircle />
												</Icon>
											</Button>
										</HStack>
									)}
								</HStack>
								<Accordion.ItemContent>
									<Accordion.ItemBody
										px={{ base: "3", sm: "4" }}
										pb={{ base: "3", sm: "4" }}
									>
										<ServicePointGrid
											servicePoints={group.servicePoints}
											onEdit={onEdit}
											onViewQR={onViewQR}
											onToggleActive={onToggleActive}
											onDelete={onDelete}
										/>
									</Accordion.ItemBody>
								</Accordion.ItemContent>
							</Box>
						</Accordion.Item>
					);
				})}
			</Accordion.Root>
		</VStack>
	);
}
