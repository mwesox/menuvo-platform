import {
	Button,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@menuvo/ui";
import { Plus, Search, X } from "lucide-react";
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
	onCreateClick: () => void;
	onBatchCreateClick: () => void;
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
	onCreateClick,
	onBatchCreateClick,
}: ServicePointsToolbarProps) {
	const { t } = useTranslation("servicePoints");

	return (
		<div className="space-y-3">
			{/* Search + Filters + Actions - responsive layout */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
				{/* Search */}
				<div className="relative flex-1">
					<Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder={t("toolbar.searchPlaceholder")}
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						className="pl-9"
					/>
				</div>

				{/* Filters + Actions */}
				<div className="flex flex-wrap items-center gap-2">
					{/* Zone filter */}
					{availableZones.length > 0 && (
						<Select
							value={selectedZones.length === 0 ? "all" : selectedZones[0]}
							onValueChange={(value) =>
								onZonesChange(value === "all" ? [] : [value])
							}
						>
							<SelectTrigger className="w-32 sm:w-36">
								<SelectValue placeholder={t("toolbar.filterByZone")} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{t("toolbar.allZones")}</SelectItem>
								{availableZones.map((zone) => (
									<SelectItem key={zone} value={zone}>
										{zone}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}

					{/* Status filter */}
					<Select
						value={statusFilter}
						onValueChange={(value) =>
							onStatusFilterChange(value as StatusFilter)
						}
					>
						<SelectTrigger className="w-28 sm:w-32">
							<SelectValue placeholder={t("toolbar.filterByStatus")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">{t("toolbar.allStatuses")}</SelectItem>
							<SelectItem value="active">{t("toolbar.activeOnly")}</SelectItem>
							<SelectItem value="inactive">
								{t("toolbar.inactiveOnly")}
							</SelectItem>
						</SelectContent>
					</Select>

					{/* Clear filters */}
					{hasActiveFilters && (
						<Button
							variant="ghost"
							size="icon"
							onClick={onClearFilters}
							className="shrink-0"
						>
							<X className="size-4" />
						</Button>
					)}

					{/* Spacer - push actions to right on larger screens */}
					<div className="hidden flex-1 sm:block" />

					{/* Actions */}
					<Button
						variant="outline"
						size="icon"
						onClick={onBatchCreateClick}
						className="sm:hidden"
						title={t("buttons.batchCreate")}
					>
						<Plus className="size-4" />
					</Button>
					<Button
						variant="outline"
						onClick={onBatchCreateClick}
						className="hidden sm:inline-flex"
					>
						<Plus className="me-2 size-4" />
						{t("buttons.batchCreate")}
					</Button>
					<Button
						size="icon"
						onClick={onCreateClick}
						className="sm:hidden"
						title={t("buttons.addServicePoint")}
					>
						<Plus className="size-4" />
					</Button>
					<Button onClick={onCreateClick} className="hidden sm:inline-flex">
						<Plus className="me-2 size-4" />
						{t("buttons.addServicePoint")}
					</Button>
				</div>
			</div>
		</div>
	);
}
