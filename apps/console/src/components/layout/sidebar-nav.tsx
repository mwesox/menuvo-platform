import { cn } from "@menuvo/ui/lib/utils";
import type { ReactNode } from "react";

export interface SidebarNavItem {
	value: string;
	label: string;
	icon?: ReactNode;
	/** Whether this item is disabled (not clickable) */
	disabled?: boolean;
	/** Badge to show next to the label */
	badge?: ReactNode;
}

export interface SidebarNavDangerItem {
	label: string;
	icon?: ReactNode;
	onClick: () => void;
}

interface SidebarNavProps {
	items: SidebarNavItem[];
	value: string;
	onChange: (value: string) => void;
	/** Optional danger zone item shown at the bottom with a divider */
	dangerItem?: SidebarNavDangerItem;
	/** Layout mode - vertical for sidebar, horizontal for mobile */
	layout?: "vertical" | "horizontal";
}

export function SidebarNav({
	items,
	value,
	onChange,
	dangerItem,
	layout = "vertical",
}: SidebarNavProps) {
	if (layout === "horizontal") {
		return (
			<div className="flex w-max gap-1">
				{items.map((item) => (
					<button
						key={item.value}
						type="button"
						onClick={() => !item.disabled && onChange(item.value)}
						disabled={item.disabled}
						className={cn(
							"flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm transition-colors",
							item.disabled
								? "cursor-not-allowed text-muted-foreground/50"
								: value === item.value
									? "bg-primary text-primary-foreground"
									: "text-muted-foreground hover:bg-muted hover:text-foreground",
						)}
					>
						{item.icon && <span className="shrink-0">{item.icon}</span>}
						{item.label}
						{item.badge}
					</button>
				))}
			</div>
		);
	}

	return (
		<nav className="space-y-1">
			{items.map((item) => (
				<button
					key={item.value}
					type="button"
					onClick={() => !item.disabled && onChange(item.value)}
					disabled={item.disabled}
					className={cn(
						"flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
						item.disabled
							? "cursor-not-allowed text-muted-foreground/50"
							: value === item.value
								? "bg-primary/10 font-medium text-primary"
								: "text-muted-foreground hover:bg-muted hover:text-foreground",
					)}
				>
					{item.icon && (
						<span
							className={cn(
								"shrink-0",
								item.disabled
									? "text-muted-foreground/50"
									: value === item.value
										? "text-primary"
										: "text-muted-foreground",
							)}
						>
							{item.icon}
						</span>
					)}
					<span className="flex-1 text-start">{item.label}</span>
					{item.badge}
				</button>
			))}

			{dangerItem && (
				<>
					<div className="my-3 border-t" />
					<button
						type="button"
						onClick={dangerItem.onClick}
						className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-destructive text-sm transition-colors hover:bg-destructive/10"
					>
						{dangerItem.icon && (
							<span className="shrink-0">{dangerItem.icon}</span>
						)}
						{dangerItem.label}
					</button>
				</>
			)}
		</nav>
	);
}
