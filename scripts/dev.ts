/**
 * Development script that runs the Vite dev server and background worker.
 * Usage: bun run dev
 *        bun run dev --tunnel  (also starts ngrok for Mollie OAuth testing)
 *
 * Background worker handles:
 *   - HTTP endpoints (health, webhooks, uploads)
 *   - Image processing (variants generation)
 *   - Menu import (AI-powered parsing)
 *   - Stripe events (payment processing)
 */

const useTunnel = process.argv.includes("--tunnel");

console.log("\n🚀 Starting development environment...\n");
console.log("  📦 Vite dev server     → http://localhost:3000");
console.log("  ⚙️  Background worker   → http://localhost:3001");
if (useTunnel) {
	console.log("  🔗 ngrok tunnel        → starting...");
}
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

// Start ngrok tunnel if --tunnel flag is passed
// Uses --host-header=rewrite to fix Bun + ngrok chunked encoding issues
// See: https://github.com/oven-sh/bun/issues/19789
let ngrok: ReturnType<typeof Bun.spawn> | null = null;
if (useTunnel) {
	ngrok = Bun.spawn(
		["ngrok", "http", "--host-header=rewrite", "3000", "--log=stdout"],
		{
			stdout: "pipe",
			stderr: "inherit",
		},
	);

	// Wait a bit then fetch the public URL from ngrok API
	setTimeout(async () => {
		try {
			const res = await fetch("http://localhost:4040/api/tunnels");
			const data = (await res.json()) as {
				tunnels: Array<{ public_url: string }>;
			};
			const publicUrl = data.tunnels.find((t) =>
				t.public_url.startsWith("https://"),
			)?.public_url;
			if (publicUrl) {
				console.log("\n  ✅ ngrok tunnel ready!");
				console.log(`  🔗 Public URL: ${publicUrl}`);
				console.log(`\n  📋 Mollie OAuth redirect URI:`);
				console.log(`     ${publicUrl}/api/mollie/callback`);
				console.log(
					"\n  ⚠️  Update MOLLIE_REDIRECT_URI in .env.local with this URL\n",
				);
			}
		} catch {
			console.log("  ⚠️  Could not get ngrok URL. Check http://localhost:4040");
		}
	}, 3000);
}

// Handle graceful shutdown
let shuttingDown = false;

async function shutdown() {
	if (shuttingDown) return;
	shuttingDown = true;

	console.log("\nShutting down...");

	// Kill processes
	vite.kill();
	worker.kill();
	ngrok?.kill();

	// Wait for processes to fully exit (with timeout)
	await Promise.race([
		Promise.all([vite.exited, worker.exited, ngrok?.exited].filter(Boolean)),
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
