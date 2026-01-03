/**
 * API Response Utilities
 *
 * Provides ergonomic helpers for API routes in TanStack Start.
 * Workaround for the lack of built-in response helpers and the
 * Nitro/Bun duplicate Transfer-Encoding header bug.
 */

type JsonValue =
	| string
	| number
	| boolean
	| null
	| JsonValue[]
	| { [key: string]: JsonValue };

interface ResponseOptions {
	status?: number;
	headers?: Record<string, string>;
}

/**
 * Create a JSON response with proper headers.
 * Uses explicit Content-Length to avoid Nitro/Bun chunked encoding bug.
 */
export function json<T extends JsonValue>(
	data: T,
	options: ResponseOptions = {},
): Response {
	const body = JSON.stringify(data);
	const { status = 200, headers = {} } = options;

	return new Response(body, {
		status,
		headers: {
			"Content-Type": "application/json",
			"Content-Length": String(new TextEncoder().encode(body).length),
			...headers,
		},
	});
}

/**
 * Create an error response.
 */
export function error(
	message: string,
	status = 400,
	extra?: Record<string, JsonValue>,
): Response {
	return json({ error: message, ...extra }, { status });
}

/**
 * Create a success response with optional data.
 */
export function ok<T extends JsonValue>(data?: T): Response {
	return json(data ?? ({ ok: true } as JsonValue));
}

/**
 * Create a 201 Created response.
 */
export function created<T extends JsonValue>(data: T): Response {
	return json(data, { status: 201 });
}

/**
 * Create a 204 No Content response.
 */
export function noContent(): Response {
	return new Response(null, { status: 204 });
}

/**
 * Create a 404 Not Found response.
 */
export function notFound(message = "Not found"): Response {
	return error(message, 404);
}

/**
 * Create a 401 Unauthorized response.
 */
export function unauthorized(message = "Unauthorized"): Response {
	return error(message, 401);
}

/**
 * Create a 403 Forbidden response.
 */
export function forbidden(message = "Forbidden"): Response {
	return error(message, 403);
}

/**
 * Create a 500 Internal Server Error response.
 */
export function serverError(message = "Internal server error"): Response {
	return error(message, 500);
}
