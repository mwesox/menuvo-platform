/**
 * Unique ID generation utilities for test data.
 * Ensures test data never collides across parallel test runs.
 */

let counter = 0;

/**
 * Generate a unique test run ID (call once per test file/suite)
 */
export function createTestRunId(): string {
	return `t${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Generate a unique identifier for test entities
 */
export function uniqueId(testRunId: string): string {
	counter++;
	return `${testRunId}_${counter}`;
}

/**
 * Generate a unique email for test data
 */
export function uniqueEmail(testRunId: string): string {
	counter++;
	return `test_${testRunId}_${counter}@test.menuvo.local`;
}

/**
 * Generate a unique slug for stores
 */
export function uniqueSlug(testRunId: string, name: string): string {
	counter++;
	const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
	return `${base}-${testRunId}-${counter}`.slice(0, 250);
}

/**
 * Reset counter (useful for isolated test suites)
 */
export function resetCounter(): void {
	counter = 0;
}
