/**
 * Text Extractor
 *
 * Extracts text content from various file formats for AI processing.
 */

import Papa from "papaparse";
import * as XLSX from "xlsx";
import { logger } from "../../../lib/logger.js";
import type { AllowedFileType } from "./types";

const menuImportLogger = logger.child({ service: "menu-import" });

/**
 * Maximum text length to send to AI (200KB).
 * Larger texts are truncated to prevent resource exhaustion and excessive API costs.
 */
const MAX_TEXT_LENGTH = 200_000;

/**
 * Result of text extraction from a file.
 */
export interface ExtractionResult {
	text: string;
	metadata: {
		rowCount?: number;
		sheetNames?: string[];
		headers?: string[];
		truncated?: boolean;
	};
}

/**
 * Extract text content from various file types.
 * Applies security limit on text length to prevent resource exhaustion.
 */
export function extractTextFromFile(
	buffer: Buffer,
	fileType: AllowedFileType,
): ExtractionResult {
	let result: ExtractionResult;

	switch (fileType) {
		case "xlsx":
			result = extractFromExcel(buffer);
			break;
		case "csv":
			result = extractFromCSV(buffer);
			break;
		case "json":
			result = extractFromJSON(buffer);
			break;
		case "md":
		case "txt":
			result = extractFromText(buffer);
			break;
		default:
			throw new Error(`Unsupported file type: ${fileType}`);
	}

	// Security: Truncate text if too large
	if (result.text.length > MAX_TEXT_LENGTH) {
		menuImportLogger.warn(
			{ originalLength: result.text.length, maxLength: MAX_TEXT_LENGTH },
			"Menu text truncated due to size limit",
		);
		result = {
			...result,
			text: result.text.slice(0, MAX_TEXT_LENGTH),
			metadata: { ...result.metadata, truncated: true },
		};
	}

	return result;
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
