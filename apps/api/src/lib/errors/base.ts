/**
 * Base error classes for typed error handling.
 *
 * Simple class-based errors with:
 * - _tag for discriminated unions
 * - Serializable to JSON for network boundary
 * - Context for additional error details
 */

/**
 * Serializable error structure for client consumption.
 */
export interface SerializedError {
	readonly _tag: string;
	readonly message: string;
	readonly code: string;
	readonly context?: Record<string, unknown>;
}

/**
 * Base class for all application errors.
 * Extends Error for stack traces, adds _tag for type discrimination.
 */
export abstract class AppError extends Error {
	abstract readonly _tag: string;
	abstract readonly code: string;
	readonly context?: Record<string, unknown>;

	constructor(message: string, context?: Record<string, unknown>) {
		super(message);
		this.name = this.constructor.name;
		this.context = context;
	}

	/**
	 * Serialize for network transport.
	 * JSON.stringify(error) calls this automatically.
	 */
	toJSON(): SerializedError {
		return {
			_tag: this._tag,
			message: this.message,
			code: this.code,
			context: this.context,
		};
	}
}

// ============================================================================
// COMMON ERRORS
// ============================================================================

/**
 * Resource not found error.
 */
export class NotFoundError extends AppError {
	readonly _tag = "NotFoundError" as const;
	readonly code = "NOT_FOUND" as const;

	constructor(resource: string, id: string | number) {
		super(`${resource} not found`, { resource, id });
	}
}

/**
 * Validation error for business rule violations.
 */
export class ValidationError extends AppError {
	readonly _tag = "ValidationError" as const;
	readonly code = "VALIDATION_ERROR" as const;

	constructor(field: string, reason: string) {
		super(`Validation failed: ${reason}`, { field, reason });
	}
}

/**
 * Business rule violation error.
 */
export class BusinessRuleError extends AppError {
	readonly _tag = "BusinessRuleError" as const;
	readonly code = "BUSINESS_RULE_VIOLATION" as const;

	constructor(rule: string, reason: string) {
		super(reason, { rule, reason });
	}
}

/**
 * External service error (Stripe, AI services, etc.).
 */
export class ExternalServiceError extends AppError {
	readonly _tag = "ExternalServiceError" as const;
	readonly code = "EXTERNAL_SERVICE_ERROR" as const;

	constructor(service: string, operation: string, details?: string) {
		super(
			details
				? `${service} failed during ${operation}: ${details}`
				: `${service} failed during ${operation}`,
			{ service, operation, details },
		);
	}
}

/**
 * Database operation error.
 */
export class DatabaseError extends AppError {
	readonly _tag = "DatabaseError" as const;
	readonly code = "DATABASE_ERROR" as const;

	constructor(operation: string, details?: string) {
		super(
			details
				? `Database error during ${operation}: ${details}`
				: `Database error during ${operation}`,
			{ operation, details },
		);
	}
}

/**
 * Unauthorized error - user lacks authentication.
 */
export class UnauthorizedError extends AppError {
	readonly _tag = "UnauthorizedError" as const;
	readonly code = "UNAUTHORIZED" as const;

	constructor(reason?: string) {
		super(reason ?? "Authentication required", reason ? { reason } : undefined);
	}
}

/**
 * Forbidden error - user lacks permission.
 */
export class ForbiddenError extends AppError {
	readonly _tag = "ForbiddenError" as const;
	readonly code = "FORBIDDEN" as const;

	constructor(resource: string, action: string) {
		super(`Not authorized to ${action} ${resource}`, { resource, action });
	}
}
