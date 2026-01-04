/**
 * HTTP client wrapper for TanStack Start server functions.
 *
 * TanStack Start server functions are invoked via HTTP with specific conventions.
 * This module provides helpers to call them correctly in k6 tests.
 */

import http from "k6/http";
import { check } from "k6";
import { getBaseUrl } from "../config/environments.js";

/**
 * Call a TanStack Start server function via POST.
 *
 * Server functions use POST requests with JSON body containing { data: {...} }
 *
 * @param {string} path - The server function path (e.g., '/api/orders')
 * @param {object} data - Input data for the server function
 * @param {object} options - Additional HTTP options (headers, cookies)
 * @returns {{ response: object, data: any }}
 */
export function postServerFn(path, data = {}, options = {}) {
	const url = `${getBaseUrl()}${path}`;

	const payload = JSON.stringify(data);

	const params = {
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
			...options.headers,
		},
		cookies: options.cookies || {},
		tags: {
			name: path,
			type: "server_function",
		},
	};

	const response = http.post(url, payload, params);

	return {
		response,
		data: parseResponse(response),
	};
}

/**
 * Call a TanStack Start server function via GET.
 *
 * @param {string} path - The server function path
 * @param {object} queryParams - Query parameters
 * @param {object} options - Additional HTTP options
 * @returns {{ response: object, data: any }}
 */
export function getServerFn(path, queryParams = {}, options = {}) {
	const queryString = new URLSearchParams(queryParams).toString();
	const url = `${getBaseUrl()}${path}${queryString ? "?" + queryString : ""}`;

	const params = {
		headers: {
			Accept: "application/json",
			...options.headers,
		},
		cookies: options.cookies || {},
		tags: {
			name: path,
			type: "server_function_get",
		},
	};

	const response = http.get(url, params);

	return {
		response,
		data: parseResponse(response),
	};
}

/**
 * Load a page (for initial HTML + hydration).
 *
 * @param {string} path - Page path
 * @param {object} options - Additional HTTP options
 * @returns {object} HTTP response
 */
export function loadPage(path, options = {}) {
	const url = `${getBaseUrl()}${path}`;

	const params = {
		headers: {
			Accept: "text/html,application/xhtml+xml",
			...options.headers,
		},
		cookies: options.cookies || {},
		tags: {
			name: path,
			type: "page_load",
		},
	};

	return http.get(url, params);
}

/**
 * Parse JSON response body safely.
 *
 * @param {object} response - HTTP response
 * @returns {any} Parsed data or null
 */
function parseResponse(response) {
	try {
		return JSON.parse(response.body);
	} catch {
		return null;
	}
}

/**
 * Batch multiple HTTP requests.
 *
 * @param {Array} requests - Array of request configs
 * @returns {Array} Array of responses
 */
export function batchRequests(requests) {
	const batchRequests = requests.map(({ method, path, data, params }) => {
		const url = `${getBaseUrl()}${path}`;
		return [
			method || "GET",
			url,
			method === "POST" ? JSON.stringify(data) : null,
			{
				headers: { "Content-Type": "application/json" },
				...(params || {}),
			},
		];
	});

	return http.batch(batchRequests);
}

/**
 * Check if response is successful.
 *
 * @param {object} response - HTTP response
 * @param {string} name - Check name for reporting
 * @returns {boolean} Success status
 */
export function checkSuccess(response, name) {
	return check(response, {
		[`${name} status is 200`]: (r) => r.status === 200,
		[`${name} has body`]: (r) => r.body && r.body.length > 0,
	});
}
