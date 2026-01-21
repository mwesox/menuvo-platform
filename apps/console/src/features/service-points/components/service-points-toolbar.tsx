import {
	Box,
	Button,
	Flex,
	HStack,
	Icon,
	Input,
	NativeSelect,
} from "@chakra-ui/react";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { StatusFilter } from "../utils/filter-service-points";

interface ServicePointsToolbarProps {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	statusFilter: StatusFilter;
	onStatusFilterChange: (status: StatusFilter) => void;
	availableZones: string[];
	selectedZones: string[];
	onZonesChange: (zones: string[]) => void;
	hasActiveFilters: boolean;
	onClearFilters: () => void;
}

export function ServicePointsToolbar({
	searchQuery,
	onSearchChange,
	statusFilter,
	onStatusFilterChange,
	availableZones,
	selectedZones,
	onZonesChange,
	hasActiveFilters,
	onClearFilters,
}: ServicePointsToolbarProps) {
	const { t } = useTranslation("servicePoints");

	return (
		<Flex
			direction={{ base: "column", sm: "row" }}
			gap="3"
			align={{ sm: "center" }}
		>
			{/* Search */}
			<Box position="relative" flex="1">
				<Icon
					position="absolute"
					top="50%"
					left="3"
					transform="translateY(-50%)"
					w="4"
					h="4"
					color="fg.muted"
					pointerEvents="none"
				>
					<Search />
				</Icon>
				<Input
					placeholder={t("toolbar.searchPlaceholder")}
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					ps="9"
				/>
			</Box>

			{/* Filters */}
			<HStack gap="2" wrap="wrap" align="center">
				{/* Zone filter */}
				{availableZones.length > 0 && (
					<NativeSelect.Root w={{ base: "32", sm: "36" }}>
						<NativeSelect.Field
							value={selectedZones.length === 0 ? "all" : selectedZones[0]}
							onChange={(e) =>
								onZonesChange(e.target.value === "all" ? [] : [e.target.value])
							}
						>
							<option value="all">{t("toolbar.allZones")}</option>
							{availableZones.map((zone) => (
								<option key={zone} value={zone}>
									{zone}
								</option>
							))}
						</NativeSelect.Field>
						<NativeSelect.Indicator />
					</NativeSelect.Root>
				)}

				{/* Status filter */}
				<NativeSelect.Root w={{ base: "28", sm: "32" }}>
					<NativeSelect.Field
						value={statusFilter}
						onChange={(e) =>
							onStatusFilterChange(e.target.value as StatusFilter)
						}
					>
						<option value="all">{t("toolbar.allStatuses")}</option>
						<option value="active">{t("toolbar.activeOnly")}</option>
						<option value="inactive">{t("toolbar.inactiveOnly")}</option>
					</NativeSelect.Field>
					<NativeSelect.Indicator />
				</NativeSelect.Root>

				{/* Clear filters */}
				{hasActiveFilters && (
					<Box flexShrink={0}>
						<Button
							variant="ghost"
							size="sm"
							w="10"
							h="10"
							p="0"
							onClick={onClearFilters}
						>
							<Icon w="4" h="4">
								<X />
							</Icon>
						</Button>
					</Box>
				)}
			</HStack>
		</Flex>
	);
}
