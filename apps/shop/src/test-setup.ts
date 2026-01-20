import * as matchers from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";
import { initI18n } from "./i18n/config";

// Extend vitest's expect with jest-dom matchers
expect.extend(matchers);

// Initialize i18next for tests
initI18n("en");
