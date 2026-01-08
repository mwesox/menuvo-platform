import { config } from "@/config";

/**
 * Get the display language for menu content.
 * Reads from global config (prototype: always "de").
 */
export function useDisplayLanguage(): string {
	return config.displayLanguage;
}
