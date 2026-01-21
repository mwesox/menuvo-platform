import { SimpleGrid } from "@chakra-ui/react";
import type { ServicePoint } from "../types";
import { ServicePointCard } from "./service-point-card";

interface ServicePointGridProps {
	servicePoints: ServicePoint[];
	onEdit: (servicePoint: ServicePoint) => void;
	onViewQR: (servicePoint: ServicePoint) => void;
	onToggleActive: (id: string, isActive: boolean) => void;
	onDelete: (id: string) => void;
}

export function ServicePointGrid({
	servicePoints,
	onEdit,
	onViewQR,
	onToggleActive,
	onDelete,
}: ServicePointGridProps) {
	return (
		<SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} gap="2">
			{servicePoints.map((sp) => (
				<ServicePointCard
					key={sp.id}
					servicePoint={sp}
					onEdit={onEdit}
					onViewQR={onViewQR}
					onToggleActive={onToggleActive}
					onDelete={onDelete}
				/>
			))}
		</SimpleGrid>
	);
}
