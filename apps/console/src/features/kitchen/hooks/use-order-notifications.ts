/**
 * Hook for order notifications with audio alerts using Web Audio API.
 *
 * Features:
 * - Detects new orders by comparing order IDs
 * - Plays notification beep when new orders arrive
 * - Repeats sound every 10 seconds while alert is active
 * - Alert is dismissed by any user interaction (handled by parent component)
 *
 * Uses React 19.2's useEffectEvent for stable event handlers in effects.
 */

import {
	useCallback,
	useEffect,
	useEffectEvent,
	useRef,
	useState,
} from "react";
import type { OrderWithItems } from "@/features/orders/types";
import {
	NOTIFICATION_BEEP_COUNT,
	NOTIFICATION_BEEP_DURATION,
	NOTIFICATION_BEEP_FREQUENCY,
	NOTIFICATION_BEEP_GAP,
	NOTIFICATION_REPEAT_INTERVAL,
} from "../constants";
import { useKitchenPreferences } from "../stores/kitchen-preferences";

// ============================================================================
// TYPES
// ============================================================================

export interface OrderNotificationsResult {
	/** Play notification sound manually */
	playNotification: () => void;
	/** Whether audio is currently muted */
	isMuted: boolean;
	/** Toggle audio mute state */
	toggleMute: () => void;
	/** Request audio permission (needed on first interaction) */
	requestPermission: () => Promise<boolean>;
	/** Whether alert is active (new orders arrived, not yet dismissed) */
	alertActive: boolean;
	/** Dismiss the alert (stops sound + flash) */
	dismissAlert: () => void;
}

// ============================================================================
// WEB AUDIO API HELPERS
// ============================================================================

/**
 * Creates and plays a beep using Web Audio API.
 */
function playBeep(audioContext: AudioContext): void {
	const oscillator = audioContext.createOscillator();
	const gainNode = audioContext.createGain();

	oscillator.connect(gainNode);
	gainNode.connect(audioContext.destination);

	oscillator.frequency.value = NOTIFICATION_BEEP_FREQUENCY;
	oscillator.type = "sine";

	// Quick fade in/out to avoid clicks
	const now = audioContext.currentTime;
	gainNode.gain.setValueAtTime(0, now);
	gainNode.gain.linearRampToValueAtTime(0.5, now + 0.01);
	gainNode.gain.linearRampToValueAtTime(0, now + NOTIFICATION_BEEP_DURATION);

	oscillator.start(now);
	oscillator.stop(now + NOTIFICATION_BEEP_DURATION);
}

/**
 * Plays multiple beeps with gaps between them.
 */
async function playNotificationBeeps(
	audioContext: AudioContext,
): Promise<void> {
	for (let i = 0; i < NOTIFICATION_BEEP_COUNT; i++) {
		playBeep(audioContext);
		if (i < NOTIFICATION_BEEP_COUNT - 1) {
			await new Promise((resolve) =>
				setTimeout(
					resolve,
					(NOTIFICATION_BEEP_DURATION + NOTIFICATION_BEEP_GAP) * 1000,
				),
			);
		}
	}
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook that handles new order notifications with audio alerts.
 *
 * Features:
 * - Detects new orders by comparing order IDs
 * - Sets alertActive when new orders arrive
 * - Repeats sound every 10 seconds while alert is active
 * - Parent component dismisses alert on user interaction
 */
export function useOrderNotifications(
	orders: OrderWithItems[],
): OrderNotificationsResult {
	const { audioMuted, toggleAudio } = useKitchenPreferences();
	const audioContextRef = useRef<AudioContext | null>(null);
	const previousOrderIdsRef = useRef<Set<string>>(new Set());
	const repeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// Alert state - true when new orders arrived, waiting for user interaction
	const [alertActive, setAlertActive] = useState(false);

	// Get existing audio context (does NOT create one - that must happen in requestPermission after user gesture)
	const getAudioContext = (): AudioContext | null => {
		return audioContextRef.current;
	};

	// Effect event - stable function that always reads latest audioMuted value
	// Can be called from effects without being a dependency
	const onPlayNotification = useEffectEvent(() => {
		if (audioMuted) {
			console.log("[Kitchen] Audio muted, skipping notification");
			return;
		}

		const audioContext = getAudioContext();
		if (!audioContext) {
			console.log("[Kitchen] No AudioContext available");
			return;
		}

		console.log(
			"[Kitchen] Playing notification, AudioContext state:",
			audioContext.state,
		);

		if (audioContext.state === "suspended") {
			audioContext
				.resume()
				.then(() => {
					console.log("[Kitchen] AudioContext resumed, playing beeps");
					playNotificationBeeps(audioContext);
				})
				.catch((err) => {
					console.log("[Kitchen] Failed to resume AudioContext:", err);
				});
		} else {
			playNotificationBeeps(audioContext);
		}
	});

	// Request permission by creating/resuming audio context (must be called after user gesture)
	const requestPermission = async (): Promise<boolean> => {
		try {
			// Create AudioContext if it doesn't exist (requires user gesture)
			if (!audioContextRef.current && typeof AudioContext !== "undefined") {
				audioContextRef.current = new AudioContext();
			}

			const audioContext = audioContextRef.current;
			if (!audioContext) {
				console.log("[Kitchen] requestPermission: No AudioContext");
				return false;
			}

			console.log(
				"[Kitchen] requestPermission: AudioContext state before:",
				audioContext.state,
			);

			if (audioContext.state === "suspended") {
				await audioContext.resume();
				console.log("[Kitchen] requestPermission: AudioContext resumed");
			}

			return true;
		} catch (err) {
			console.log("[Kitchen] requestPermission failed:", err);
			return false;
		}
	};

	// Dismiss alert - stops repeating sound and clears visual alert
	const dismissAlert = useCallback(() => {
		setAlertActive(false);
		if (repeatIntervalRef.current) {
			clearInterval(repeatIntervalRef.current);
			repeatIntervalRef.current = null;
		}
	}, []);

	// Cleanup audio context and interval on unmount
	useEffect(() => {
		return () => {
			if (audioContextRef.current) {
				audioContextRef.current.close();
				audioContextRef.current = null;
			}
			if (repeatIntervalRef.current) {
				clearInterval(repeatIntervalRef.current);
				repeatIntervalRef.current = null;
			}
		};
	}, []);

	// Detect new orders and activate alert
	useEffect(() => {
		const currentOrderIds = new Set(orders.map((o) => o.id));
		const previousOrderIds = previousOrderIdsRef.current;

		// Find new orders (IDs that weren't in previous set)
		const newOrderIds = [...currentOrderIds].filter(
			(id) => !previousOrderIds.has(id),
		);

		// Activate alert if there are new orders and this isn't the initial load
		if (newOrderIds.length > 0 && previousOrderIds.size > 0) {
			console.log(
				"[Kitchen] New orders detected:",
				newOrderIds,
				"alertActive -> true",
			);
			setAlertActive(true);
			// Play initial notification if audio is enabled
			if (!audioMuted) {
				onPlayNotification();
			}
		} else if (newOrderIds.length > 0) {
			console.log("[Kitchen] Initial load, orders:", newOrderIds.length);
		}

		// Update previous IDs
		previousOrderIdsRef.current = currentOrderIds;
	}, [orders, audioMuted]); // onPlayNotification excluded - it's an effect event

	// Repeat sound while alert is active
	useEffect(() => {
		// Clear any existing interval
		if (repeatIntervalRef.current) {
			clearInterval(repeatIntervalRef.current);
			repeatIntervalRef.current = null;
		}

		// Start repeating if alert is active and audio is enabled
		if (alertActive && !audioMuted) {
			repeatIntervalRef.current = setInterval(() => {
				onPlayNotification();
			}, NOTIFICATION_REPEAT_INTERVAL);
		}

		return () => {
			if (repeatIntervalRef.current) {
				clearInterval(repeatIntervalRef.current);
				repeatIntervalRef.current = null;
			}
		};
	}, [alertActive, audioMuted]); // onPlayNotification excluded - it's an effect event

	return {
		playNotification: onPlayNotification,
		isMuted: audioMuted,
		toggleMute: toggleAudio,
		requestPermission,
		alertActive,
		dismissAlert,
	};
}
