/**
 * Hook for tracking online/offline connection status.
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import { RECONNECTION_FEEDBACK_DURATION_MS } from "../constants";

// ============================================================================
// EXTERNAL STORE FOR SSR-SAFE ONLINE STATUS
// ============================================================================

function subscribe(callback: () => void) {
	window.addEventListener("online", callback);
	window.addEventListener("offline", callback);
	return () => {
		window.removeEventListener("online", callback);
		window.removeEventListener("offline", callback);
	};
}

function getSnapshot() {
	return navigator.onLine;
}

function getServerSnapshot() {
	// Assume online during SSR
	return true;
}

// ============================================================================
// HOOK
// ============================================================================

export interface ConnectionStatusResult {
	/** Whether the browser is online */
	isOnline: boolean;
	/** Whether we recently reconnected (within RECONNECTION_FEEDBACK_DURATION_MS) */
	justReconnected: boolean;
}

/**
 * Hook to track browser online/offline status.
 * Uses useSyncExternalStore for SSR-safe access to navigator.onLine.
 */
export function useConnectionStatus(): ConnectionStatusResult {
	const isOnline = useSyncExternalStore(
		subscribe,
		getSnapshot,
		getServerSnapshot,
	);

	const [justReconnected, setJustReconnected] = useState(false);

	// Track reconnection for visual feedback
	useEffect(() => {
		if (isOnline && !justReconnected) {
			// Check if we were previously offline (by checking if justReconnected was set)
			// This is a simple heuristic - in production you might track previous state
		}
	}, [isOnline, justReconnected]);

	// Listen for online event to set justReconnected
	useEffect(() => {
		function handleOnline() {
			setJustReconnected(true);
			const timeout = setTimeout(
				() => setJustReconnected(false),
				RECONNECTION_FEEDBACK_DURATION_MS,
			);
			return () => clearTimeout(timeout);
		}

		window.addEventListener("online", handleOnline);
		return () => window.removeEventListener("online", handleOnline);
	}, []);

	return {
		isOnline,
		justReconnected,
	};
}
