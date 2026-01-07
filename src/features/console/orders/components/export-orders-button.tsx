import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import type { OrderStatus } from "@/features/orders";
import { getOrdersForExport } from "../server/export.functions";
import {
	downloadCSV,
	generateExportFilename,
	generateOrdersCSV,
} from "../utils/csv-export";

interface ExportOrdersButtonProps {
	storeId: string;
	statusFilter?: OrderStatus;
	searchFilter?: string;
	fromDate?: string;
}

/**
 * Button to export orders to CSV.
 * Respects current filters and has a 1000 order limit.
 */
export function ExportOrdersButton({
	storeId,
	statusFilter,
	searchFilter,
	fromDate,
}: ExportOrdersButtonProps) {
	const { t } = useTranslation("console-orders");
	const [isExporting, setIsExporting] = useState(false);

	const handleExport = async () => {
		setIsExporting(true);

		try {
			const result = await getOrdersForExport({
				data: {
					storeId,
					status: statusFilter,
					search: searchFilter,
					fromDate,
				},
			});

			if (result.orders.length === 0) {
				toast.info(t("export.noData"));
				return;
			}

			const csvContent = generateOrdersCSV(result.orders);
			const filename = generateExportFilename();
			downloadCSV(csvContent, filename);

			if (result.limited) {
				toast.success(
					t("export.successLimited", {
						count: result.orders.length,
						total: result.total,
					}),
				);
			} else {
				toast.success(t("export.success", { count: result.orders.length }));
			}
		} catch (error) {
			console.error("Export failed:", error);
			toast.error(t("export.error"));
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="outline"
					size="icon"
					onClick={handleExport}
					disabled={isExporting}
				>
					{isExporting ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<Download className="size-4" />
					)}
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				<p>{t("export.tooltip")}</p>
			</TooltipContent>
		</Tooltip>
	);
}
