/**
 * Security tests for text extraction.
 *
 * Tests text length limits and truncation behavior.
 */

import { describe, expect, it } from "vitest";
import { extractTextFromFile } from "./text-extractor";

describe("Text Extractor Security", () => {
	describe("text length limit", () => {
		const MAX_TEXT_LENGTH = 200_000;

		it("truncates text that exceeds the limit", () => {
			// Create a buffer with content larger than 200KB
			const largeContent = "A".repeat(MAX_TEXT_LENGTH + 50_000);
			const buffer = Buffer.from(largeContent);

			const result = extractTextFromFile(buffer, "txt");

			expect(result.text.length).toBe(MAX_TEXT_LENGTH);
			expect(result.metadata.truncated).toBe(true);
		});

		it("does not truncate text within the limit", () => {
			const normalContent = "Menu Item - $9.99\n".repeat(100);
			const buffer = Buffer.from(normalContent);

			const result = extractTextFromFile(buffer, "txt");

			expect(result.text).toBe(normalContent.trim());
			expect(result.metadata.truncated).toBeUndefined();
		});

		it("handles exactly at limit", () => {
			const exactContent = "B".repeat(MAX_TEXT_LENGTH);
			const buffer = Buffer.from(exactContent);

			const result = extractTextFromFile(buffer, "txt");

			expect(result.text.length).toBe(MAX_TEXT_LENGTH);
			expect(result.metadata.truncated).toBeUndefined();
		});

		it("truncates large CSV content", () => {
			// Create a CSV that will exceed the limit
			const header = "Name,Price,Description\n";
			const row = "Item Name,999,A very long description that takes up space\n";
			const rowCount = Math.ceil((MAX_TEXT_LENGTH + 10_000) / row.length);
			const largeCSV = header + row.repeat(rowCount);
			const buffer = Buffer.from(largeCSV);

			const result = extractTextFromFile(buffer, "csv");

			expect(result.text.length).toBeLessThanOrEqual(MAX_TEXT_LENGTH);
			if (result.text.length === MAX_TEXT_LENGTH) {
				expect(result.metadata.truncated).toBe(true);
			}
		});

		it("truncates large JSON content", () => {
			// Create a JSON that will exceed the limit
			const items = Array.from({ length: 10000 }, (_, i) => ({
				name: `Item ${i}`,
				description: "A".repeat(100),
				price: 999,
			}));
			const largeJSON = JSON.stringify({ items });
			const buffer = Buffer.from(largeJSON);

			const result = extractTextFromFile(buffer, "json");

			expect(result.text.length).toBeLessThanOrEqual(MAX_TEXT_LENGTH);
		});

		it("truncates large markdown content", () => {
			const largeMD =
				"# Menu\n\n" + "- Item $9.99: Description here\n".repeat(20000);
			const buffer = Buffer.from(largeMD);

			const result = extractTextFromFile(buffer, "md");

			expect(result.text.length).toBeLessThanOrEqual(MAX_TEXT_LENGTH);
			if (result.text.length === MAX_TEXT_LENGTH) {
				expect(result.metadata.truncated).toBe(true);
			}
		});
	});

	describe("file type handling", () => {
		it("extracts text from TXT files", () => {
			const content = "Simple menu text";
			const buffer = Buffer.from(content);

			const result = extractTextFromFile(buffer, "txt");

			expect(result.text).toBe(content);
		});

		it("extracts text from MD files", () => {
			const content = "# Menu\n\n- Item 1\n- Item 2";
			const buffer = Buffer.from(content);

			const result = extractTextFromFile(buffer, "md");

			expect(result.text).toBe(content);
		});

		it("extracts and formats CSV files", () => {
			const csv = "Name,Price\nBurger,999\nSalad,599";
			const buffer = Buffer.from(csv);

			const result = extractTextFromFile(buffer, "csv");

			expect(result.text).toContain("Name");
			expect(result.text).toContain("Burger");
			expect(result.metadata.headers).toContain("Name");
			expect(result.metadata.headers).toContain("Price");
		});

		it("extracts and formats JSON files", () => {
			const json = JSON.stringify({
				items: [{ name: "Burger", price: 999 }],
			});
			const buffer = Buffer.from(json);

			const result = extractTextFromFile(buffer, "json");

			expect(result.text).toContain("Burger");
			expect(result.text).toContain("999");
		});

		it("throws for unsupported file types", () => {
			const buffer = Buffer.from("content");

			expect(() => extractTextFromFile(buffer, "pdf" as "txt")).toThrow(
				"Unsupported file type",
			);
		});
	});
});
