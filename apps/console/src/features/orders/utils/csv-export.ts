/**
 * CSV export utilities for orders.
 */

import type { ExportOrderRow } from "../schemas";

const CSV_HEADERS = [
	"Order ID",
	"Date",
	"Store",
	"Customer Name",
	"Customer Email",
	"Customer Phone",
	"Order Type",
	"Status",
	"Payment Status",
	"Total Amount",
] as const;

/**
 * Escape CSV field value.
 * Wraps in quotes if contains comma, quote, or newline.
 * Doubles any existing quotes.
 */
function escapeCSVField(value: string): string {
	if (value.includes(",") || value.includes('"') || value.includes("\n")) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

/**
 * Format amount in cents to currency string (e.g., 1500 -> "15.00")
 */
function formatAmount(cents: number): string {
	return (cents / 100).toFixed(2);
}

/**
 * Format ISO date to readable format (DD/MM/YYYY HH:mm)
 */
function formatDate(isoDate: string): string {
	const date = new Date(isoDate);
	return date.toLocaleString("en-GB", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

/**
 * Format order type for display
 */
function formatOrderType(type: string): string {
	const types: Record<string, string> = {
		dine_in: "Dine In",
		takeaway: "Takeaway",
		delivery: "Delivery",
	};
	return types[type] ?? type;
}

/**
 * Format status for display
 */
function formatStatus(status: string): string {
	return status
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

/**
 * Generate CSV content from order rows
 */
export function generateOrdersCSV(orders: ExportOrderRow[]): string {
	const headerRow = CSV_HEADERS.join(",");

	const dataRows = orders.map((order) => {
		const fields = [
			order.orderId,
			formatDate(order.date),
			escapeCSVField(order.storeName),
			escapeCSVField(order.customerName),
			escapeCSVField(order.customerEmail),
			escapeCSVField(order.customerPhone),
			formatOrderType(order.orderType),
			formatStatus(order.status),
			formatStatus(order.paymentStatus),
			formatAmount(order.totalAmount),
		];
		return fields.join(",");
	});

	return [headerRow, ...dataRows].join("\n");
}

/**
 * Trigger CSV download in browser.
 * Uses the anchor element pattern for reliable downloads.
 */
export function downloadCSV(csvContent: string, filename: string): void {
	const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);

	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);

	URL.revokeObjectURL(url);
}

/**
 * Generate filename for export.
 * Format: orders-{date}.csv
 */
export function generateExportFilename(): string {
	const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
	return `orders-${date}.csv`;
}
