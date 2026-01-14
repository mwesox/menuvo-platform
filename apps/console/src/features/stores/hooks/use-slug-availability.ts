/**
 * Slug Availability Hook
 *
 * Provides real-time slug availability checking for store names.
 * Uses React 19's useDeferredValue for built-in debouncing.
 * Slug generation happens server-side to keep frontend simple.
 */

import { useQuery } from "@tanstack/react-query";
import { useDeferredValue } from "react";
import { useTRPC } from "@/lib/trpc";

export interface UseSlugAvailabilityOptions {
	/** Store name to generate slug from */
	name: string;
	/** Current slug of the store (for edit mode) */
	currentSlug?: string;
	/** Store ID to exclude from uniqueness check (for updates) */
	storeId?: string;
}

export interface SlugAvailabilityResult {
	/** Generated slug from the name (from API) */
	slug: string;
	/** Whether the API check is in progress */
	isChecking: boolean;
	/** Whether the slug is available (null if not yet checked) */
	isAvailable: boolean | null;
	/** First available alternative slug if the primary is taken */
	nextAvailable: string | null;
}

/**
 * Hook for real-time slug availability checking.
 * Slug generation happens server-side.
 */
export function useSlugAvailability({
	name,
	currentSlug,
	storeId,
}: UseSlugAvailabilityOptions): SlugAvailabilityResult {
	const trpc = useTRPC();

	// Debounce the name for API calls
	const deferredName = useDeferredValue(name);

	// Check availability via API (server generates slug)
	const { data, isLoading, isFetching } = useQuery({
		...trpc.store.checkSlugAvailability.queryOptions({
			name: deferredName,
			storeId,
		}),
		enabled: deferredName.length > 0,
	});

	const slug = data?.slug ?? "";
	const suggestions = data?.suggestions ?? [];

	// If slug matches current, it's available (no change needed)
	const isUnchanged = Boolean(currentSlug && slug === currentSlug);

	return {
		slug,
		isChecking: isLoading || isFetching,
		isAvailable: isUnchanged ? true : (data?.available ?? null),
		nextAvailable: suggestions[0] ?? null,
	};
}
