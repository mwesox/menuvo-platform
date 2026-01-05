import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LinkCardProps {
	href: string;
	icon: LucideIcon;
	title: string;
	description?: React.ReactNode;
	badge?: React.ReactNode;
	disabled?: boolean;
	showChevron?: boolean;
	children?: React.ReactNode;
}

export function LinkCard({
	href,
	icon: Icon,
	title,
	description,
	badge,
	disabled,
	showChevron,
	children,
}: LinkCardProps) {
	const content = (
		<Card
			className={cn(
				"h-full overflow-hidden transition-all",
				!disabled && "hover:shadow-md hover:bg-muted/30 cursor-pointer group",
				disabled && "opacity-70 cursor-not-allowed",
			)}
		>
			<CardHeader className="flex-row items-start gap-4 pb-4">
				<div
					className={cn(
						"flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
						disabled ? "bg-muted" : "bg-primary/10",
					)}
				>
					<Icon
						className={cn(
							"h-6 w-6",
							disabled ? "text-muted-foreground" : "text-primary",
						)}
					/>
				</div>
				<div className="min-w-0 flex-1 space-y-1">
					<CardTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight">
						{title}
						{badge}
					</CardTitle>
					{description && (
						<CardDescription className="text-sm">{description}</CardDescription>
					)}
				</div>
				{showChevron && !disabled && (
					<ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
				)}
			</CardHeader>
			{children && <CardContent className="pt-0">{children}</CardContent>}
		</Card>
	);

	if (disabled) {
		return content;
	}

	return (
		<Link to={href} className="block">
			{content}
		</Link>
	);
}
