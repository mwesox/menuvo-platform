/**
 * Vitest Global Setup
 *
 * Runs before all tests. Configures mocks and test environment.
 */

import { vi } from "vitest";

// Set required environment variables for tests
// Must be set before any module imports env.ts
process.env.ENCRYPTION_KEY =
	"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.OPENROUTER_API_KEY = "test-api-key";
process.env.NODE_ENV = "test";

// Mock the email service to prevent actual email sending during tests
vi.mock("../infrastructure/email/service.js", () => ({
	sendEmail: vi.fn().mockResolvedValue(undefined),
}));
