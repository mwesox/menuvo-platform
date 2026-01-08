import type { ErrorComponentProps } from "@tanstack/react-router";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@menuvo/ui/button";

interface ConsoleErrorProps extends ErrorComponentProps {
	/** Custom title override */
	title?: string;
	/** Custom description override */
	description?: string;
}

/**
 * Error component for Console routes.
 * Shows a centered error message with retry button.
 */
export function ConsoleError({ reset, title, description }: ConsoleErrorProps) {
	const { t } = useTranslation("common");

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
			<Button onClick={reset} variant="outline" className="mt-6">
				<RefreshCw className="me-2 size-4" />
				{t("error.tryAgain", "Try again")}
			</Button>
		</div>
	);
}
