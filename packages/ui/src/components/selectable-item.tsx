import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "../lib/utils";

const selectableItemVariants = cva(
	"flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
	{
		variants: {
			variant: {
				default:
					"hover:bg-accent hover:text-accent-foreground hover:[&_[data-slot=description]]:text-accent-foreground/80 hover:[&_[data-slot=media-icon]]:bg-primary hover:[&_[data-slot=media-icon]]:text-primary-foreground",
				selected:
					"bg-accent text-accent-foreground [&_[data-slot=description]]:text-accent-foreground/80 [&_[data-slot=media-icon]]:bg-primary [&_[data-slot=media-icon]]:text-primary-foreground",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

function SelectableItem({
	className,
	variant = "default",
	asChild = false,
	...props
}: React.ComponentProps<"div"> &
	VariantProps<typeof selectableItemVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot : "div";

	return (
		<Comp
			data-slot="selectable-item"
			data-variant={variant}
			data-selected={variant === "selected"}
			className={cn(selectableItemVariants({ variant, className }))}
			{...props}
		/>
	);
}

const selectableItemMediaVariants = cva(
	"flex flex-shrink-0 items-center justify-center",
	{
		variants: {
			variant: {
				icon: "size-8 rounded-md bg-muted",
				image: "size-10",
			},
		},
		defaultVariants: {
			variant: "icon",
		},
	},
);

function SelectableItemMedia({
	className,
	variant = "icon",
	...props
}: React.ComponentProps<"div"> &
	VariantProps<typeof selectableItemMediaVariants>) {
	return (
		<div
			data-slot={variant === "icon" ? "media-icon" : "media-image"}
			className={cn(selectableItemMediaVariants({ variant, className }))}
			{...props}
		/>
	);
}

function SelectableItemContent({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="content"
			className={cn("min-w-0 flex-1", className)}
			{...props}
		/>
	);
}

function SelectableItemTitle({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			data-slot="title"
			className={cn("truncate font-medium", className)}
			{...props}
		/>
	);
}

function SelectableItemDescription({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="description"
			className={cn("text-muted-foreground text-xs", className)}
			{...props}
		/>
	);
}

function SelectableItemActions({
	className,
	...props
}: React.ComponentProps<"div">) {
	return (
		<div
			data-slot="actions"
			className={cn("flex flex-shrink-0 items-center gap-2", className)}
			{...props}
		/>
	);
}

export {
	SelectableItem,
	SelectableItemMedia,
	SelectableItemContent,
	SelectableItemTitle,
	SelectableItemDescription,
	SelectableItemActions,
	selectableItemVariants,
};
