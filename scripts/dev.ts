/**
 * Development script that runs the Vite dev server and background worker.
 * Usage: bun run dev
 *
 * Background worker handles:
 *   - HTTP endpoints (health, webhooks, uploads)
 *   - Image processing (variants generation)
 *   - Menu import (AI-powered parsing)
 *   - Stripe events (payment processing)
 */

console.log("\n🚀 Starting development environment...\n");
console.log("  📦 Vite dev server     → http://localhost:3000");
console.log("  ⚙️  Background worker   → http://localhost:3001");
console.log("");

const vite = Bun.spawn(["bun", "--bun", "vite", "dev", "--port", "3000"], {
	stdout: "inherit",
	stderr: "inherit",
	stdin: "inherit",
});

const worker = Bun.spawn(
	["bun", "--bun", "run", "src/worker/main.ts", "--type", "all"],
	{
		stdout: "inherit",
		stderr: "inherit",
	},
);

// Handle graceful shutdown
let shuttingDown = false;

async function shutdown() {
	if (shuttingDown) return;
	shuttingDown = true;

	console.log("\nShutting down...");

	// Kill processes
	vite.kill();
	worker.kill();

	// Wait for processes to fully exit (with timeout)
	await Promise.race([
		Promise.all([vite.exited, worker.exited]),
		Bun.sleep(2000), // 2 second timeout
	]);

	process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Wait for both processes
await Promise.race([vite.exited, worker.exited]);

// If one exits, kill the other
vite.kill();
worker.kill();

export {};
