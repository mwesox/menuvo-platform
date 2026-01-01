import { useEffect, useState } from "react";

/**
 * Hook to track media query matches.
 * Uses matchMedia API for efficient, native breakpoint detection.
 *
 * @param query - CSS media query string (e.g., "(max-width: 1023px)")
 * @returns boolean indicating if the query matches
 *
 * @example
 * const isMobile = useMediaQuery("(max-width: 1023px)");
 * const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
 */
export function useMediaQuery(query: string): boolean {
	const [matches, setMatches] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia(query);

		// Set initial value
		setMatches(mediaQuery.matches);

		// Create event listener
		const handler = (event: MediaQueryListEvent) => {
			setMatches(event.matches);
		};

		// Add listener
		mediaQuery.addEventListener("change", handler);

		// Cleanup
		return () => {
			mediaQuery.removeEventListener("change", handler);
		};
	}, [query]);

	return matches;
}

/**
 * Convenience hook for mobile detection.
 * Returns true when viewport is below lg breakpoint (1024px).
 */
export function useIsMobile(): boolean {
	return useMediaQuery("(max-width: 1023px)");
}
