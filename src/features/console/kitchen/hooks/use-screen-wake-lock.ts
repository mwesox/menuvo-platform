/**
 * Hook for keeping the screen awake using the Screen Wake Lock API.
 * Prevents the device from dimming or locking the screen while the kitchen monitor is active.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface ScreenWakeLockResult {
	/** Whether the Screen Wake Lock API is supported in this browser */
	readonly isSupported: boolean;
	/** Whether a wake lock is currently active */
	readonly isActive: boolean;
}

/**
 * Hook to prevent the screen from turning off while the kitchen monitor is active.
 *
 * Uses the Screen Wake Lock API which is supported in Chrome, Edge, and Safari 16.4+.
 * Not supported in Firefox.
 *
 * The wake lock is automatically released when:
 * - The component unmounts
 * - The tab becomes hidden (browser behavior)
 *
 * When the tab becomes visible again, the wake lock is re-acquired automatically.
 */
export function useScreenWakeLock(): ScreenWakeLockResult {
	const [isSupported] = useState(
		() => typeof navigator !== "undefined" && "wakeLock" in navigator,
	);
	const [isActive, setIsActive] = useState(false);
	const wakeLockRef = useRef<WakeLockSentinel | null>(null);

	const requestWakeLock = useCallback(async () => {
		if (!isSupported) return;

		// Don't request if we already have an active lock
		if (wakeLockRef.current && !wakeLockRef.current.released) return;

		try {
			const wakeLock = await navigator.wakeLock.request("screen");
			wakeLockRef.current = wakeLock;
			setIsActive(true);

			// Use onrelease property to avoid listener accumulation
			wakeLock.onrelease = () => {
				setIsActive(false);
			};
		} catch {
			// Wake lock request failed (e.g., low battery, permission denied)
			setIsActive(false);
		}
	}, [isSupported]);

	const releaseWakeLock = useCallback(() => {
		if (wakeLockRef.current) {
			// Fire and forget - cleanup doesn't need to await
			void wakeLockRef.current.release().catch(() => {
				// Already released, ignore
			});
			wakeLockRef.current = null;
			setIsActive(false);
		}
	}, []);

	// Request wake lock on mount, release on unmount
	useEffect(() => {
		requestWakeLock();
		return releaseWakeLock;
	}, [requestWakeLock, releaseWakeLock]);

	// Re-acquire wake lock when tab becomes visible
	useEffect(() => {
		if (!isSupported) return;

		function handleVisibilityChange() {
			if (document.visibilityState === "visible") {
				requestWakeLock();
			}
		}

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [isSupported, requestWakeLock]);

	return {
		isSupported,
		isActive,
	};
}
