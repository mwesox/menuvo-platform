/**
 * Hook for order notifications with audio alerts using Web Audio API.
 *
 * Uses React 19.2's useEffectEvent for stable event handlers in effects.
 */

import { useEffect, useEffectEvent, useRef } from "react";
import type { OrderWithItems } from "@/features/orders/types";
import {
	NOTIFICATION_BEEP_COUNT,
	NOTIFICATION_BEEP_DURATION,
	NOTIFICATION_BEEP_FREQUENCY,
	NOTIFICATION_BEEP_GAP,
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
 * Detects new orders by comparing order IDs and plays notification beep.
 */
export function useOrderNotifications(
	orders: OrderWithItems[],
): OrderNotificationsResult {
	const { audioMuted, toggleAudio } = useKitchenPreferences();
	const audioContextRef = useRef<AudioContext | null>(null);
	const previousOrderIdsRef = useRef<Set<number>>(new Set());
	const hasInteractedRef = useRef(false);

	// Initialize audio context lazily (must be after user interaction)
	const getAudioContext = (): AudioContext | null => {
		if (!audioContextRef.current && typeof AudioContext !== "undefined") {
			audioContextRef.current = new AudioContext();
		}
		return audioContextRef.current;
	};

	// Effect event - stable function that always reads latest audioMuted value
	// Can be called from effects without being a dependency
	const onPlayNotification = useEffectEvent(() => {
		if (audioMuted) return;

		const audioContext = getAudioContext();
		if (!audioContext) return;

		if (audioContext.state === "suspended") {
			audioContext.resume().then(() => {
				playNotificationBeeps(audioContext);
			});
		} else {
			playNotificationBeeps(audioContext);
		}
	});

	// Request permission by interacting with audio context
	const requestPermission = async (): Promise<boolean> => {
		try {
			const audioContext = getAudioContext();
			if (!audioContext) return false;

			if (audioContext.state === "suspended") {
				await audioContext.resume();
			}

			hasInteractedRef.current = true;
			return true;
		} catch {
			return false;
		}
	};

	// Cleanup audio context on unmount
	useEffect(() => {
		return () => {
			if (audioContextRef.current) {
				audioContextRef.current.close();
				audioContextRef.current = null;
			}
		};
	}, []);

	// Detect new orders and play notification
	useEffect(() => {
		if (audioMuted || !hasInteractedRef.current) return;

		const currentOrderIds = new Set(orders.map((o) => o.id));
		const previousOrderIds = previousOrderIdsRef.current;

		// Find new orders (IDs that weren't in previous set)
		const newOrderIds = [...currentOrderIds].filter(
			(id) => !previousOrderIds.has(id),
		);

		// Play notification if there are new orders and this isn't the initial load
		if (newOrderIds.length > 0 && previousOrderIds.size > 0) {
			onPlayNotification();
		}

		// Update previous IDs
		previousOrderIdsRef.current = currentOrderIds;
	}, [orders, audioMuted]); // onPlayNotification excluded - it's an effect event

	return {
		playNotification: onPlayNotification,
		isMuted: audioMuted,
		toggleMute: toggleAudio,
		requestPermission,
	};
}
