/**
 * Error Mapper
 *
 * Maps domain errors to TRPCError codes.
 * Used in router layer to translate domain service errors to HTTP responses.
 */

import { TRPCError } from "@trpc/server";
import {
	ConflictError,
	DomainError,
	ForbiddenError,
	NotFoundError,
	ValidationError,
} from "../domains/errors.js";

/**
 * Maps a domain error to a TRPCError and throws it.
 * If the error is not a known domain error, it is re-thrown as-is.
 *
 * @param error - The error to map
 * @throws TRPCError with the appropriate code
 */
export function mapDomainErrorToTRPC(error: unknown): never {
	if (error instanceof NotFoundError) {
		throw new TRPCError({ code: "NOT_FOUND", message: error.message });
	}
	if (error instanceof ValidationError) {
		throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
	}
	if (error instanceof ConflictError) {
		throw new TRPCError({ code: "CONFLICT", message: error.message });
	}
	if (error instanceof ForbiddenError) {
		throw new TRPCError({ code: "FORBIDDEN", message: error.message });
	}
	if (error instanceof DomainError) {
		const codeMap: Record<string, TRPCError["code"]> = {
			NOT_FOUND: "NOT_FOUND",
			VALIDATION: "BAD_REQUEST",
			CONFLICT: "CONFLICT",
			FORBIDDEN: "FORBIDDEN",
		};
		throw new TRPCError({
			code: codeMap[error.code] ?? "INTERNAL_SERVER_ERROR",
			message: error.message,
		});
	}
	throw error;
}
