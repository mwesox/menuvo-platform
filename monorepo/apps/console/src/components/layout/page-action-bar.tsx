import { Tabs, TabsList, TabsTrigger } from "@menuvo/ui/components/tabs";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@menuvo/ui/button";

interface TabItem {
	value: string;
	label: string;
}

interface PageActionBarProps {
	title?: string;
	backHref?: string;
	backLabel?: string;
	actions?: React.ReactNode;
	tabs?: {
		items: TabItem[];
		value: string;
		onChange: (value: string) => void;
	};
}

export function PageActionBar({
	title,
	backHref,
	backLabel,
	actions,
	tabs,
}: PageActionBarProps) {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					{backHref && (
						<Button variant="ghost" size="icon" asChild>
							<Link to={backHref}>
								<ArrowLeft className="h-4 w-4" />
								<span className="sr-only">{backLabel ?? "Back"}</span>
							</Link>
						</Button>
					)}
					{(title || backLabel) && (
						<h1 className="font-semibold text-2xl tracking-tight">
							{title ?? backLabel}
						</h1>
					)}
				</div>
				{actions && <div className="flex items-center gap-2">{actions}</div>}
			</div>
			{tabs && (
				<Tabs value={tabs.value} onValueChange={tabs.onChange}>
					<TabsList>
						{tabs.items.map((item) => (
							<TabsTrigger key={item.value} value={item.value}>
								{item.label}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
			)}
		</div>
	);
}
