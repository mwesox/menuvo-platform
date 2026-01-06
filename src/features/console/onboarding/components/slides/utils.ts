/**
 * Extract error message from TanStack Form error.
 * Handles both string format (from .min/.max) and object format (from .refine).
 */
export function getErrorMessage(error: unknown): string {
	if (typeof error === "string") return error;
	if (error && typeof error === "object" && "message" in error) {
		return (error as { message: string }).message;
	}
	return "";
}
