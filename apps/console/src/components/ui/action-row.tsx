import { cn } from "@menuvo/ui/lib/utils";
import type { ReactNode } from "react";

interface ActionRowProps {
	/** Primary label for the row */
	label: string;
	/** Optional description below the label */
	description?: string;
	/** Action element - typically a Switch, Button, or Badge */
	action?: ReactNode;
	/** Additional className */
	className?: string;
}

/**
 * A row with label, description, and action element.
 * Commonly used for toggles, buttons, or displaying status.
 */
export function ActionRow({
	label,
	description,
	action,
	className,
}: ActionRowProps) {
	return (
		<div
			className={cn(
				"flex items-center justify-between gap-4 px-4 py-3",
				className,
			)}
		>
			<div className="min-w-0 flex-1">
				<div className="font-medium text-sm">{label}</div>
				{description && (
					<div className="mt-0.5 text-muted-foreground text-sm">
						{description}
					</div>
				)}
			</div>
			{action && <div className="shrink-0">{action}</div>}
		</div>
	);
}
