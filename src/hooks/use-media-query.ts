import { useSyncExternalStore } from "react";

/**
 * Hook to track media query matches.
 * Uses matchMedia API for efficient, native breakpoint detection.
 * Properly handles SSR by using useSyncExternalStore.
 *
 * @param query - CSS media query string (e.g., "(max-width: 1023px)")
 * @returns boolean indicating if the query matches
 *
 * @example
 * const isMobile = useMediaQuery("(max-width: 1023px)");
 * const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
 */
export function useMediaQuery(query: string): boolean {
	const subscribe = (callback: () => void) => {
		const mediaQuery = window.matchMedia(query);
		mediaQuery.addEventListener("change", callback);
		return () => mediaQuery.removeEventListener("change", callback);
	};

	const getSnapshot = () => window.matchMedia(query).matches;

	// During SSR, default to false (desktop-first approach)
	const getServerSnapshot = () => false;

	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Convenience hook for mobile detection.
 * Returns true when viewport is below lg breakpoint (1024px).
 */
export function useIsMobile(): boolean {
	return useMediaQuery("(max-width: 1023px)");
}
