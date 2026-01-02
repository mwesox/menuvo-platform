/**
 * Development script that runs both the Vite dev server and background workers.
 * Usage: bun run dev
 */

const vite = Bun.spawn(["bun", "--bun", "vite", "dev", "--port", "3000"], {
	stdout: "inherit",
	stderr: "inherit",
	stdin: "inherit",
});

const worker = Bun.spawn(["bun", "--bun", "run", "src/lib/queue/worker.ts"], {
	stdout: "inherit",
	stderr: "inherit",
});

// Handle graceful shutdown
process.on("SIGINT", () => {
	console.log("\nShutting down...");
	vite.kill();
	worker.kill();
	process.exit(0);
});

process.on("SIGTERM", () => {
	console.log("\nShutting down...");
	vite.kill();
	worker.kill();
	process.exit(0);
});

// Wait for both processes
await Promise.race([vite.exited, worker.exited]);

// If one exits, kill the other
vite.kill();
worker.kill();
