/**
 * Development script that runs the Vite dev server and all background workers.
 * Usage: bun run dev
 *
 * Workers include:
 *   - Image processing worker (image variants generation)
 *   - Menu import worker (AI-powered menu parsing)
 */

console.log("\n🚀 Starting development environment...\n");
console.log("  📦 Vite dev server     → http://localhost:3000");
console.log("  🖼️  Image worker        → processing image variants");
console.log("  📋 Import worker       → processing menu imports");
console.log("");

const vite = Bun.spawn(["bun", "--bun", "vite", "dev", "--port", "3000"], {
	stdout: "inherit",
	stderr: "inherit",
	stdin: "inherit",
});

const worker = Bun.spawn(
	["bun", "--bun", "run", "src/lib/queue/worker.ts", "--type", "all"],
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
