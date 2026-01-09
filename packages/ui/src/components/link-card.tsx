import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./card";

type LinkCardProps = {
	icon: LucideIcon;
	title: string;
	description?: React.ReactNode;
	badge?: React.ReactNode;
	action?: React.ReactNode;
	disabled?: boolean;
	showChevron?: boolean;
	children?: React.ReactNode;
} & ({ href: string; onClick?: never } | { href?: never; onClick: () => void });

export function LinkCard({
	href,
	onClick,
	icon: Icon,
	title,
	description,
	badge,
	action,
	disabled,
	showChevron,
	children,
}: LinkCardProps) {
	const content = (
		<Card
			className={cn(
				"h-full overflow-hidden transition-all",
				!disabled && "group cursor-pointer hover:bg-muted/30 hover:shadow-md",
				disabled && "cursor-not-allowed opacity-70",
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
					<CardTitle className="flex items-center gap-2 font-semibold text-xl tracking-tight">
						{title}
						{badge}
					</CardTitle>
					{description && (
						<CardDescription className="text-sm">{description}</CardDescription>
					)}
				</div>
				{action}
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

	if (href) {
		return (
			<Link to={href} className="block">
				{content}
			</Link>
		);
	}

	return (
		<button type="button" onClick={onClick} className="block w-full text-left">
			{content}
		</button>
	);
}
