/**
 * Zustand store for kitchen monitor preferences.
 *
 * Persists user preferences like audio mute state to localStorage.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface KitchenPreferencesState {
	/** Whether audio notifications are muted */
	audioMuted: boolean;
}

interface KitchenPreferencesActions {
	/** Set audio muted state */
	setAudioMuted: (muted: boolean) => void;
	/** Toggle audio muted state */
	toggleAudio: () => void;
}

export type KitchenPreferencesStore = KitchenPreferencesState &
	KitchenPreferencesActions;

export const useKitchenPreferences = create<KitchenPreferencesStore>()(
	persist(
		(set) => ({
			// State
			audioMuted: false,

			// Actions
			setAudioMuted: (muted) => set({ audioMuted: muted }),
			toggleAudio: () => set((state) => ({ audioMuted: !state.audioMuted })),
		}),
		{
			name: "menuvo-kitchen-prefs",
		},
	),
);
