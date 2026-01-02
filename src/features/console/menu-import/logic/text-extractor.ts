import Papa from "papaparse";
import * as XLSX from "xlsx";
import type { AllowedFileType } from "../validation";

/**
 * Result of text extraction from a file.
 */
export interface ExtractionResult {
	text: string;
	metadata: {
		rowCount?: number;
		sheetNames?: string[];
		headers?: string[];
	};
}

/**
 * Extract text content from various file types.
 */
export function extractTextFromFile(
	buffer: Buffer,
	fileType: AllowedFileType,
): ExtractionResult {
	switch (fileType) {
		case "xlsx":
			return extractFromExcel(buffer);
		case "csv":
			return extractFromCSV(buffer);
		case "json":
			return extractFromJSON(buffer);
		case "md":
		case "txt":
			return extractFromText(buffer);
		default:
			throw new Error(`Unsupported file type: ${fileType}`);
	}
}

/**
 * Extract text from Excel file.
 * Converts all sheets to a readable text format.
 */
function extractFromExcel(buffer: Buffer): ExtractionResult {
	const workbook = XLSX.read(buffer, { type: "buffer" });
	const sheetNames = workbook.SheetNames;

	let fullText = "";
	let totalRows = 0;

	for (const sheetName of sheetNames) {
		const sheet = workbook.Sheets[sheetName];
		if (!sheet) continue;

		// Convert to CSV format (preserves structure)
		const csv = XLSX.utils.sheet_to_csv(sheet);
		fullText += `## Sheet: ${sheetName}\n${csv}\n\n`;

		const rows = XLSX.utils.sheet_to_json(sheet);
		totalRows += rows.length;
	}

	return {
		text: fullText.trim(),
		metadata: { rowCount: totalRows, sheetNames },
	};
}

/**
 * Extract text from CSV file.
 * Formats as a readable table structure.
 */
function extractFromCSV(buffer: Buffer): ExtractionResult {
	const csvText = buffer.toString("utf-8");
	const parsed = Papa.parse(csvText, { header: true });

	const headers = parsed.meta.fields || [];
	let text = `${headers.join(" | ")}\n`;
	text += `${"-".repeat(50)}\n`;

	for (const row of parsed.data as Record<string, string>[]) {
		const values = headers.map((h) => row[h] || "");
		text += `${values.join(" | ")}\n`;
	}

	return {
		text: text.trim(),
		metadata: { rowCount: parsed.data.length, headers },
	};
}

/**
 * Extract text from JSON file.
 * Pretty prints for AI readability.
 */
function extractFromJSON(buffer: Buffer): ExtractionResult {
	const jsonText = buffer.toString("utf-8");
	const data = JSON.parse(jsonText);
	const text = JSON.stringify(data, null, 2);

	return {
		text,
		metadata: {},
	};
}

/**
 * Extract text from plain text or markdown file.
 */
function extractFromText(buffer: Buffer): ExtractionResult {
	const text = buffer.toString("utf-8");

	return {
		text: text.trim(),
		metadata: {},
	};
}
