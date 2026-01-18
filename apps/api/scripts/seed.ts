/**
 * Seed Script Entry Point
 *
 * Seeds the database with test data for local development.
 * Run with: bun run seed (from root or apps/api)
 */

import { db } from "@menuvo/db";
import { DomainServices } from "../src/domains/services.js";
import { runSeed } from "./seed/index.js";

async function main() {
	console.log("Starting seed script...\n");

	const services = new DomainServices({ db });

	try {
		await runSeed(services);
		console.log("\nSeed completed successfully!");
		process.exit(0);
	} catch (error) {
		console.error("\nSeed failed:", error);
		process.exit(1);
	}
}

main();
