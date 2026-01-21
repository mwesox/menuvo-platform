import { IconButton, Portal, Tooltip } from "@chakra-ui/react";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { OrderStatus } from "@/features/orders";
import type { ExportOrderRow } from "@/features/orders/schemas";
import { useTRPCClient } from "@/lib/trpc";
import {
	downloadCSV,
	generateExportFilename,
	generateOrdersCSV,
} from "../utils/csv-export";

interface ExportOrdersButtonProps {
	storeId: string;
	statusFilter?: OrderStatus;
	fromDate?: string;
}

/**
 * Button to export orders to CSV.
 * Respects current filters and has a 1000 order limit.
 */
export function ExportOrdersButton({
	storeId,
	statusFilter,
	fromDate,
}: ExportOrdersButtonProps) {
	const { t } = useTranslation("console-orders");
	const [isExporting, setIsExporting] = useState(false);
	const trpcClient = useTRPCClient();

	const handleExport = async () => {
		setIsExporting(true);

		try {
			// Calculate date range (default: last 30 days)
			const endDate = new Date();
			const startDate = fromDate
				? new Date(fromDate)
				: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

			const apiOrders = await trpcClient.order.getForExport.query({
				storeId,
				startDate,
				endDate,
				status: statusFilter,
			});

			if (apiOrders.length === 0) {
				toast.info(t("export.noData"));
				return;
			}

			// Transform API response to ExportOrderRow format
			const orders: ExportOrderRow[] = apiOrders.map((order) => ({
				orderId: order.orderId,
				date: order.createdAt.toISOString(),
				storeName: "", // Store name not included in API response, will be empty
				customerName: order.customerName ?? "",
				customerEmail: order.customerEmail ?? "",
				customerPhone: order.customerPhone ?? "",
				orderType: order.orderType,
				status: order.status,
				paymentStatus: order.paymentStatus,
				totalAmount: order.totalAmount,
			}));

			const csvContent = generateOrdersCSV(orders);
			const filename = generateExportFilename();
			downloadCSV(csvContent, filename);

			toast.success(t("export.success", { count: orders.length }));
		} catch (error) {
			console.error("Export failed:", error);
			toast.error(t("export.error"));
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<Tooltip.Root>
			<Tooltip.Trigger asChild>
				<IconButton
					variant="outline"
					size="sm"
					onClick={handleExport}
					disabled={isExporting}
					aria-label={t("export.tooltip")}
				>
					{isExporting ? (
						<Loader2 style={{ height: "1rem", width: "1rem" }} />
					) : (
						<Download style={{ height: "1rem", width: "1rem" }} />
					)}
				</IconButton>
			</Tooltip.Trigger>
			<Portal>
				<Tooltip.Positioner>
					<Tooltip.Content>{t("export.tooltip")}</Tooltip.Content>
				</Tooltip.Positioner>
			</Portal>
		</Tooltip.Root>
	);
}
