import { cn } from "@menuvo/ui/lib/utils";
import type { ReactNode } from "react";

interface ContentSectionProps {
	/** Section title - displayed outside/above the content */
	title: string;
	/** Optional description below the title */
	description?: string;
	/** Content of the section */
	children: ReactNode;
	/**
	 * Variant for content container:
	 * - "card": Content wrapped in a bordered card (for form inputs)
	 * - "plain": No wrapper, just the children (for toggle rows)
	 */
	variant?: "card" | "plain";
	/** Additional className for the section wrapper */
	className?: string;
}

/**
 * Content section with title OUTSIDE the content area.
 * Creates clear visual hierarchy with prominent headers.
 */
export function ContentSection({
	title,
	description,
	children,
	variant = "card",
	className,
}: ContentSectionProps) {
	return (
		<section className={cn("space-y-3", className)}>
			{/* Header - outside the card */}
			<div>
				<h3 className="font-semibold text-base">{title}</h3>
				{description && (
					<p className="mt-0.5 text-muted-foreground text-sm">{description}</p>
				)}
			</div>

			{/* Content */}
			{variant === "card" ? (
				<div className="rounded-lg border bg-card p-4">{children}</div>
			) : (
				<div className="divide-y rounded-lg border">{children}</div>
			)}
		</section>
	);
}
