import { handleHealth } from "./handlers/health";
import { handleImageUpload } from "./handlers/images";
import { handleStripeV1, handleStripeV2 } from "./handlers/stripe";

interface RouterContext {
	workerType: string;
}

/**
 * CORS headers for dev (cross-origin requests from Vite dev server).
 * In production, Caddy handles same-origin routing so CORS isn't needed.
 */
const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
};

function withCors(response: Response): Response {
	const headers = new Headers(response.headers);
	for (const [key, value] of Object.entries(CORS_HEADERS)) {
		headers.set(key, value);
	}
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

/**
 * HTTP request router for the background worker.
 *
 * Routes:
 * - GET  /health                 - Health check (Redis connectivity)
 * - POST /api/images/upload      - Image upload (S3 + DB + queue)
 * - POST /webhooks/stripe        - Stripe V1 snapshot events
 * - POST /webhooks/stripe/thin   - Stripe V2 thin events
 */
export async function handleRequest(
	req: Request,
	ctx: RouterContext,
): Promise<Response> {
	const url = new URL(req.url);
	const method = req.method;

	// Health check
	if (url.pathname === "/health" && method === "GET") {
		return handleHealth(ctx);
	}

	// Image upload - with CORS for dev (Vite proxy bypass)
	if (url.pathname === "/api/images/upload") {
		if (method === "OPTIONS") {
			return new Response(null, { status: 204, headers: CORS_HEADERS });
		}
		if (method === "POST") {
			const response = await handleImageUpload(req);
			return withCors(response);
		}
	}

	// Stripe V1 webhooks (snapshot events)
	if (url.pathname === "/webhooks/stripe" && method === "POST") {
		return handleStripeV1(req);
	}

	// Stripe V2 webhooks (thin events)
	if (url.pathname === "/webhooks/stripe/thin" && method === "POST") {
		return handleStripeV2(req);
	}

	return new Response("Not Found", { status: 404 });
}
