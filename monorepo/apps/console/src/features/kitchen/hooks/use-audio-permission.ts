/**
 * Hook for managing audio permission and alert dismissal effects.
 *
 * Handles:
 * - Enabling audio on first user interaction (browser requirement)
 * - Dismissing alerts on user activity
 */

import { useEffect, useEffectEvent } from "react";

interface UseAudioPermissionOptions {
	/** Function to request audio permission */
	requestPermission: () => void;
	/** Whether an alert is currently active */
	alertActive: boolean;
	/** Function to dismiss the active alert */
	dismissAlert: () => void;
}

/**
 * Sets up event listeners for audio permission and alert dismissal.
 *
 * Audio permission:
 * - Browsers require a user gesture before audio can play
 * - This listens for click/touchstart/keydown and enables audio
 *
 * Alert dismissal:
 * - When an alert is active, any user interaction dismisses it
 */
export function useAudioPermission({
	requestPermission,
	alertActive,
	dismissAlert,
}: UseAudioPermissionOptions) {
	// Stable reference to requestPermission for use in effects
	const onRequestPermission = useEffectEvent(() => {
		requestPermission();
	});

	// Stable reference to dismissAlert
	const onDismissAlert = useEffectEvent(() => {
		dismissAlert();
	});

	// Enable audio on first user interaction with the page
	useEffect(() => {
		const events = ["click", "touchstart", "keydown"] as const;

		for (const event of events) {
			window.addEventListener(event, onRequestPermission, { once: true });
		}

		return () => {
			for (const event of events) {
				window.removeEventListener(event, onRequestPermission);
			}
		};
	}, []); // onRequestPermission excluded - it's an effect event

	// Set up global event listeners to dismiss alert on any user interaction
	useEffect(() => {
		if (!alertActive) return;

		const events = ["mousemove", "click", "touchstart", "keydown"] as const;

		for (const event of events) {
			window.addEventListener(event, onDismissAlert, { once: true });
		}

		return () => {
			for (const event of events) {
				window.removeEventListener(event, onDismissAlert);
			}
		};
	}, [alertActive]); // onDismissAlert excluded - it's an effect event
}
