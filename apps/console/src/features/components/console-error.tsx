import type { ErrorComponentProps } from "@tanstack/react-router";
import { AlertCircle, RefreshCw } from "lucide-react";
import { i18n } from "@/i18n";

interface ConsoleErrorProps extends ErrorComponentProps {
	/** Custom title override */
	title?: string;
	/** Custom description override */
	description?: string;
}

/**
 * Error component for Console routes.
 * Shows a centered error message with retry button.
 * Uses i18n instance directly (not hook) since error components may render outside React tree.
 * Uses plain button to avoid any component dependencies that might use hooks.
 */
export function ConsoleError({ reset, title, description }: ConsoleErrorProps) {
	// Use i18n instance directly instead of hook (error components may be outside React context)
	// Safe fallback: if i18n isn't initialized or fails, use fallback strings
	const t = (key: string, fallback: string): string => {
		try {
			if (i18n && i18n.isInitialized) {
				const translated = i18n.t(key, {
					ns: "common",
					defaultValue: fallback,
				});
				return translated || fallback;
			}
		} catch {
			// Silently fall back to English
		}
		return fallback;
	};

	return (
		<div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
			<div className="mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10">
				<AlertCircle className="size-7 text-destructive" />
			</div>
			<h2 className="font-semibold text-foreground text-xl">
				{title ?? t("error.title", "Something went wrong")}
			</h2>
			<p className="mt-2 max-w-md text-muted-foreground">
				{description ??
					t(
						"error.description",
						"We couldn't load this page. Please try again.",
					)}
			</p>
			<button
				type="button"
				onClick={reset}
				className="mt-6 inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
			>
				<RefreshCw className="me-2 size-4" />
				{t("error.tryAgain", "Try again")}
			</button>
		</div>
	);
}
