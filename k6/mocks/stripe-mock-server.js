/**
 * Stripe Mock Server for k6 Load Tests
 *
 * Mocks the Stripe Checkout API to avoid hitting the real Stripe API during load tests.
 * Uses Bun's native HTTP server for performance.
 *
 * Endpoints:
 * - POST /v1/checkout/sessions - Create checkout session
 * - GET /v1/checkout/sessions/:id - Retrieve session status
 * - POST /v1/checkout/sessions/:id/expire - Expire a session
 * - GET /health - Health check
 *
 * Run: bun run k6/mocks/stripe-mock-server.js
 */

const sessions = new Map();
let sessionCounter = 0;

/**
 * Create a mock checkout session.
 */
function createSession(body) {
	const sessionId = `cs_test_${++sessionCounter}_${Date.now()}`;
	const clientSecret = `cs_secret_${sessionId}`;

	const session = {
		id: sessionId,
		object: "checkout.session",
		client_secret: clientSecret,
		status: "open",
		payment_status: "unpaid",
		url: `http://localhost:4242/checkout/${sessionId}`,
		expires_at: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
		created: Date.now(),
		metadata: body.metadata || {},
		amount_total: body.line_items?.[0]?.price_data?.unit_amount || 1000,
		currency: body.line_items?.[0]?.price_data?.currency || "eur",
	};

	sessions.set(sessionId, session);

	return session;
}

/**
 * Get a checkout session by ID.
 */
function getSession(sessionId) {
	const session = sessions.get(sessionId);

	if (!session) {
		return null;
	}

	// Simulate payment completion after 5 seconds
	if (Date.now() - session.created > 5000 && session.status === "open") {
		session.status = "complete";
		session.payment_status = "paid";
	}

	return session;
}

/**
 * Expire a checkout session.
 */
function expireSession(sessionId) {
	const session = sessions.get(sessionId);

	if (!session) {
		return null;
	}

	session.status = "expired";
	return session;
}

/**
 * Parse URL path to extract session ID.
 */
function extractSessionId(pathname) {
	const match = pathname.match(/\/v1\/checkout\/sessions\/([^/]+)/);
	return match ? match[1] : null;
}

/**
 * Handle incoming requests.
 */
async function handleRequest(request) {
	const url = new URL(request.url);
	const pathname = url.pathname;
	const method = request.method;

	// Add CORS headers
	const headers = {
		"Content-Type": "application/json",
		"Access-Control-Allow-Origin": "*",
		"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type, Authorization",
	};

	// Handle preflight
	if (method === "OPTIONS") {
		return new Response(null, { status: 204, headers });
	}

	// Health check
	if (pathname === "/health") {
		return new Response(
			JSON.stringify({
				status: "ok",
				sessions: sessions.size,
				uptime: process.uptime(),
			}),
			{ headers }
		);
	}

	// Create checkout session
	if (method === "POST" && pathname === "/v1/checkout/sessions") {
		const body = await request.json().catch(() => ({}));

		// Simulate Stripe latency (50-200ms)
		await new Promise((resolve) => setTimeout(resolve, Math.random() * 150 + 50));

		const session = createSession(body);
		return new Response(JSON.stringify(session), { headers });
	}

	// Get session status
	if (method === "GET" && pathname.startsWith("/v1/checkout/sessions/")) {
		const sessionId = extractSessionId(pathname);
		const session = getSession(sessionId);

		if (!session) {
			return new Response(
				JSON.stringify({
					error: {
						type: "invalid_request_error",
						message: `No such checkout session: ${sessionId}`,
					},
				}),
				{ status: 404, headers }
			);
		}

		return new Response(JSON.stringify(session), { headers });
	}

	// Expire session
	if (method === "POST" && pathname.endsWith("/expire")) {
		const sessionId = extractSessionId(pathname);
		const session = expireSession(sessionId);

		if (!session) {
			return new Response(
				JSON.stringify({
					error: {
						type: "invalid_request_error",
						message: `No such checkout session: ${sessionId}`,
					},
				}),
				{ status: 404, headers }
			);
		}

		return new Response(JSON.stringify(session), { headers });
	}

	// Not found
	return new Response(
		JSON.stringify({
			error: {
				type: "invalid_request_error",
				message: `Unrecognized request URL (${method} ${pathname})`,
			},
		}),
		{ status: 404, headers }
	);
}

// Start server
const PORT = process.env.PORT || 4242;

const server = Bun.serve({
	port: PORT,
	fetch: handleRequest,
});

console.log(`
╔══════════════════════════════════════════════════════════════╗
║           Stripe Mock Server for Load Testing                ║
╠══════════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                                  ║
║  Health: http://localhost:${PORT}/health                        ║
╠══════════════════════════════════════════════════════════════╣
║  Endpoints:                                                  ║
║  • POST /v1/checkout/sessions                                ║
║  • GET  /v1/checkout/sessions/:id                            ║
║  • POST /v1/checkout/sessions/:id/expire                     ║
╚══════════════════════════════════════════════════════════════╝
`);
