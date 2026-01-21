import { describe, expect, it } from "vitest";
import {
	COUNTRIES,
	findCountryByCode,
	findCountryByDialCode,
	formatE164,
	parseE164,
} from "./phone-input-countries";

describe("phone-input-countries", () => {
	describe("COUNTRIES", () => {
		it("should have Germany as the first country", () => {
			const germany = COUNTRIES[0];
			expect(germany).toBeDefined();
			expect(germany?.code).toBe("DE");
			expect(germany?.dialCode).toBe("+49");
		});

		it("should prioritize DACH countries (DE, AT, CH)", () => {
			expect(COUNTRIES[0]?.code).toBe("DE");
			expect(COUNTRIES[1]?.code).toBe("AT");
			expect(COUNTRIES[2]?.code).toBe("CH");
		});

		it("should have valid structure for all countries", () => {
			for (const country of COUNTRIES) {
				expect(country.code).toMatch(/^[A-Z]{2}$/);
				expect(country.dialCode).toMatch(/^\+\d+$/);
				expect(country.name).toBeTruthy();
				expect(country.flag).toBeTruthy();
			}
		});
	});

	describe("findCountryByCode", () => {
		it("should find Germany by code", () => {
			const country = findCountryByCode("DE");
			expect(country).toBeDefined();
			expect(country?.dialCode).toBe("+49");
			expect(country?.name).toBe("Germany");
		});

		it("should find country case-insensitively", () => {
			expect(findCountryByCode("de")).toBeDefined();
			expect(findCountryByCode("De")).toBeDefined();
			expect(findCountryByCode("DE")).toBeDefined();
		});

		it("should return undefined for unknown code", () => {
			expect(findCountryByCode("XX")).toBeUndefined();
			expect(findCountryByCode("")).toBeUndefined();
		});
	});

	describe("findCountryByDialCode", () => {
		it("should find Germany by dial code", () => {
			const country = findCountryByDialCode("+49");
			expect(country).toBeDefined();
			expect(country?.code).toBe("DE");
		});

		it("should return first match for shared dial codes", () => {
			const country = findCountryByDialCode("+1");
			expect(country).toBeDefined();
			expect(["US", "CA"]).toContain(country?.code);
		});

		it("should return undefined for unknown dial code", () => {
			expect(findCountryByDialCode("+999")).toBeUndefined();
			expect(findCountryByDialCode("")).toBeUndefined();
		});
	});

	describe("parseE164", () => {
		it("should parse German phone number", () => {
			const result = parseE164("+4917612345678");
			expect(result).not.toBeNull();
			expect(result?.country.code).toBe("DE");
			expect(result?.number).toBe("17612345678");
		});

		it("should parse Austrian phone number", () => {
			const result = parseE164("+43660123456");
			expect(result).not.toBeNull();
			expect(result?.country.code).toBe("AT");
			expect(result?.number).toBe("660123456");
		});

		it("should handle longer dial codes correctly", () => {
			const ireland = parseE164("+353871234567");
			expect(ireland?.country.code).toBe("IE");
			expect(ireland?.number).toBe("871234567");
		});

		it("should return null for empty value", () => {
			expect(parseE164("")).toBeNull();
		});

		it("should return null for value without +", () => {
			expect(parseE164("4917612345678")).toBeNull();
		});

		it("should return null for unknown dial code", () => {
			expect(parseE164("+99912345678")).toBeNull();
		});
	});

	describe("formatE164", () => {
		const germany = COUNTRIES[0];
		if (!germany) throw new Error("Germany not found in COUNTRIES");

		it("should format German number correctly", () => {
			expect(formatE164(germany, "17612345678")).toBe("+4917612345678");
		});

		it("should strip non-digit characters", () => {
			expect(formatE164(germany, "176 123 456 78")).toBe("+4917612345678");
			expect(formatE164(germany, "176-123-456-78")).toBe("+4917612345678");
		});

		it("should strip leading zero from local format", () => {
			expect(formatE164(germany, "017612345678")).toBe("+4917612345678");
		});

		it("should handle empty number", () => {
			expect(formatE164(germany, "")).toBe("+49");
		});

		it("should work with different countries", () => {
			const austria = findCountryByCode("AT");
			const switzerland = findCountryByCode("CH");
			expect(austria).toBeDefined();
			expect(switzerland).toBeDefined();
			if (austria)
				expect(formatE164(austria, "660123456")).toBe("+43660123456");
			if (switzerland)
				expect(formatE164(switzerland, "791234567")).toBe("+41791234567");
		});
	});
});
