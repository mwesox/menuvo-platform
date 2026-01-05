/**
 * Detailed timing breakdown test.
 * Measures each phase of the request to identify bottlenecks.
 */

import { check } from "k6";
import http from "k6/http";
import { Trend } from "k6/metrics";
import { getBaseUrl } from "../config/environments.js";

const TEST_STORE_SLUG = __ENV.TEST_STORE_SLUG || "pizza-weso";

// Custom metrics for each timing phase
const dnsLookup = new Trend("timing_dns_lookup");
const tcpConnect = new Trend("timing_tcp_connect");
const tlsHandshake = new Trend("timing_tls_handshake");
const ttfb = new Trend("timing_ttfb"); // Time to First Byte (server processing)
const contentTransfer = new Trend("timing_content_transfer");
const totalDuration = new Trend("timing_total");

export const options = {
	vus: __ENV.VUS ? parseInt(__ENV.VUS) : 1,
	iterations: __ENV.ITERATIONS ? parseInt(__ENV.ITERATIONS) : 20,
	thresholds: {
		timing_ttfb: ["p(95)<500"], // Server should respond in <500ms
	},
};

export default function () {
	const baseUrl = getBaseUrl();
	const url = `${baseUrl}/${TEST_STORE_SLUG}`;

	const response = http.get(url, {
		tags: { name: "menu_load" },
	});

	// Extract timing from response
	const timings = response.timings;

	// Record each phase
	dnsLookup.add(timings.blocked); // DNS + blocked time
	tcpConnect.add(timings.connecting);
	tlsHandshake.add(timings.tls_handshaking);
	ttfb.add(timings.waiting); // Server processing time
	contentTransfer.add(timings.receiving);
	totalDuration.add(timings.duration);

	check(response, {
		"status 200": (r) => r.status === 200,
	});
}

export function handleSummary(data) {
	const metrics = data.metrics;

	const fmt = (m) => {
		if (!m?.values) return "N/A";
		return {
			avg: m.values.avg?.toFixed(1) + "ms",
			p50: m.values["p(50)"]?.toFixed(1) + "ms",
			p95: m.values["p(95)"]?.toFixed(1) + "ms",
			max: m.values.max?.toFixed(1) + "ms",
		};
	};

	console.log("\n" + "=".repeat(60));
	console.log("  TIMING BREAKDOWN - Where does the latency go?");
	console.log("=".repeat(60));

	console.log("\n📊 Phase Breakdown (avg / p95 / max):");
	console.log("─".repeat(50));

	const phases = [
		["DNS + Blocked", "timing_dns_lookup"],
		["TCP Connect", "timing_tcp_connect"],
		["TLS Handshake", "timing_tls_handshake"],
		["⭐ Server Processing (TTFB)", "timing_ttfb"],
		["Content Transfer", "timing_content_transfer"],
		["─".repeat(40), null],
		["TOTAL", "timing_total"],
	];

	for (const [label, metric] of phases) {
		if (!metric) {
			console.log(label);
			continue;
		}
		const m = metrics[metric];
		if (m?.values) {
			const avg = m.values.avg?.toFixed(1).padStart(7);
			const p95 = m.values["p(95)"]?.toFixed(1).padStart(7);
			const max = m.values.max?.toFixed(1).padStart(7);
			console.log(`  ${label.padEnd(30)} ${avg}ms  ${p95}ms  ${max}ms`);
		}
	}

	console.log("\n💡 Key Insight:");
	const ttfbVal = metrics.timing_ttfb?.values?.["p(95)"];
	const totalVal = metrics.timing_total?.values?.["p(95)"];
	if (ttfbVal && totalVal) {
		const serverPct = ((ttfbVal / totalVal) * 100).toFixed(0);
		const networkPct = (100 - serverPct).toFixed(0);
		console.log(`   Server processing: ${serverPct}% of total time`);
		console.log(`   Network overhead:  ${networkPct}% of total time`);

		if (ttfbVal > 100) {
			console.log("\n⚠️  Server processing > 100ms - check database queries");
		}
		if (totalVal - ttfbVal > 100) {
			console.log("\n⚠️  Network overhead > 100ms - consider CDN caching");
		}
	}

	console.log("\n" + "=".repeat(60) + "\n");

	return {};
}
