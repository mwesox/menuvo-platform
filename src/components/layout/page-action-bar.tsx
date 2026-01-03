import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface TabItem {
	value: string;
	label: string;
	count?: number;
	warning?: boolean;
}

interface PageActionBarProps {
	/** Page title - shown when no backHref */
	title?: string;
	/** Back link - shows arrow + navigates back */
	backHref?: string;
	/** Back link label for accessibility */
	backLabel?: string;
	/** Tab navigation items */
	tabs?: {
		items: TabItem[];
		value: string;
		onChange: (value: string) => void;
	};
	/** Actions slot - buttons, dropdowns, etc. */
	actions?: React.ReactNode;
	/** Additional className for the container */
	className?: string;
}

export function PageActionBar({
	title,
	backHref,
	backLabel,
	tabs,
	actions,
	className,
}: PageActionBarProps) {
	const hasTabs = tabs && tabs.items.length > 0;

	return (
		<div className={cn("border-b border-border", className)}>
			{/* Row 1: Context + Actions (always) */}
			<div className="flex h-12 items-center justify-between px-0">
				{/* Zone 1: Context (left) */}
				<div className="flex items-center gap-2">
					{backHref ? (
						<Link
							to={backHref}
							preload={false}
							className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
						>
							<ArrowLeft className="h-4 w-4" />
							{backLabel && <span>{backLabel}</span>}
						</Link>
					) : title ? (
						<h1 className="text-lg font-semibold">{title}</h1>
					) : null}
				</div>

				{/* Zone 3: Actions (right) - visible on all screen sizes */}
				{actions && <div className="flex items-center gap-2">{actions}</div>}
			</div>

			{/* Row 2: Tabs (if present) */}
			{hasTabs && (
				<nav className="flex gap-6 overflow-x-auto">
					{tabs.items.map((tab) => (
						<button
							key={tab.value}
							type="button"
							onClick={() => tabs.onChange(tab.value)}
							className={cn(
								"relative flex items-center gap-1.5 whitespace-nowrap pb-3 text-sm font-medium transition-colors",
								"hover:text-foreground",
								tabs.value === tab.value
									? "text-foreground"
									: "text-muted-foreground",
							)}
						>
							<span>{tab.label}</span>
							{tab.count !== undefined && (
								<span
									className={cn(
										"tabular-nums",
										tabs.value === tab.value
											? "text-foreground"
											: "text-muted-foreground",
									)}
								>
									· {tab.count}
								</span>
							)}
							{tab.warning && (
								<span className="flex h-2 w-2 rounded-full bg-destructive" />
							)}
							{/* Active indicator */}
							{tabs.value === tab.value && (
								<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
							)}
						</button>
					))}
				</nav>
			)}
		</div>
	);
}
