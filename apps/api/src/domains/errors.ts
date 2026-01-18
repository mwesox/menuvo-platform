/**
 * Domain Error Definitions
 *
 * Re-exports consolidated error types from lib/errors.
 * Domain services use these errors, which are mapped to TRPCError codes in the router layer.
 *
 * For compatibility with existing domain code, we provide wrapper classes that accept
 * simple message strings, while the underlying lib errors support richer context.
 */

import {
	AppError,
	ConflictError as LibConflictError,
	ForbiddenError as LibForbiddenError,
	NotFoundError as LibNotFoundError,
	ValidationError as LibValidationError,
} from "../lib/errors/index.js";

/**
 * DomainErrorCode type for backward compatibility
 */
export type DomainErrorCode =
	| "NOT_FOUND"
	| "VALIDATION"
	| "CONFLICT"
	| "FORBIDDEN";

/**
 * DomainError - Base error class for backward compatibility
 * Maps old DomainError(code, message) pattern to AppError subclasses
 */
export class DomainError extends AppError {
	readonly _tag = "DomainError" as const;
	readonly code: DomainErrorCode;

	constructor(code: DomainErrorCode, message: string) {
		super(message, { code });
		this.code = code;
	}
}

/**
 * NotFoundError - Resource not found
 * Compatible with domain usage: new NotFoundError("Store not found")
 */
export class NotFoundError extends LibNotFoundError {
	constructor(message: string) {
		// Extract resource and id from message if possible, otherwise use message as resource
		super(message, "unknown");
	}
}

/**
 * ValidationError - Validation failed
 * Compatible with domain usage: new ValidationError("Failed to create store")
 */
export class ValidationError extends LibValidationError {
	constructor(message: string) {
		// Use message as reason, field is optional
		super("validation", message);
	}
}

/**
 * ConflictError - Resource conflict
 * Compatible with domain usage: new ConflictError("Duplicate entry")
 */
export class ConflictError extends LibConflictError {}

/**
 * ForbiddenError - Access denied
 * Compatible with domain usage: new ForbiddenError("Store not found or access denied")
 */
export class ForbiddenError extends LibForbiddenError {
	constructor(message: string) {
		// Extract resource and action from message if possible
		// For simple messages, use message as resource
		super(message, "access");
	}
}
