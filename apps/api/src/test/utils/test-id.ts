/**
 * Test ID Utilities
 *
 * Generates unique identifiers for test isolation.
 */

let counter = 0;

/**
 * Creates a unique test run ID for isolating test data.
 */
export function createTestRunId(): string {
	return `test-${Date.now()}-${++counter}`;
}

/**
 * Creates a unique email address for test data.
 */
export function uniqueEmail(testRunId: string): string {
	return `${testRunId}-${++counter}@test.local`;
}
