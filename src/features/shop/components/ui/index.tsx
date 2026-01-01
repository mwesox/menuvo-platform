/**
 * Shop UI Primitives
 *
 * Reusable UI components styled for the shop theme.
 * These wrap complex CSS patterns into simple, composable components.
 */

import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { formatPrice as formatPriceCents } from "../../utils";

// =============================================================================
// TYPOGRAPHY
// =============================================================================

const headingVariants = cva("text-foreground", {
	variants: {
		size: {
			xs: "text-sm",
			sm: "text-base",
			md: "text-lg",
			lg: "text-xl",
			xl: "text-2xl",
			"2xl": "text-3xl",
		},
	},
	defaultVariants: {
		size: "lg",
	},
});

type HeadingProps = ComponentProps<"h1"> &
	VariantProps<typeof headingVariants> & {
		as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "span" | "p";
	};

/**
 * Shop heading with serif font (Instrument Serif).
 * Use for all headings, titles, and item names.
 */
export function ShopHeading({
	as: Component = "h2",
	size,
	className,
	style,
	...props
}: HeadingProps) {
	return (
		<Component
			className={cn(headingVariants({ size }), className)}
			style={{ fontFamily: "var(--font-heading)", ...style }}
			{...props}
		/>
	);
}

/**
 * Shop body text with sans-serif font (DM Sans).
 * Use for descriptions and regular content.
 */
export function ShopText({ className, ...props }: ComponentProps<"p">) {
	return <p className={cn("text-foreground", className)} {...props} />;
}

/**
 * Muted/secondary text.
 * Use for descriptions, helper text, and less important content.
 */
export function ShopMutedText({ className, ...props }: ComponentProps<"p">) {
	return <p className={cn("text-muted-foreground", className)} {...props} />;
}

// =============================================================================
// PRICE
// =============================================================================

const priceVariants = cva("tabular-nums text-foreground", {
	variants: {
		size: {
			sm: "text-sm",
			md: "text-base",
			lg: "text-lg font-semibold",
			xl: "text-xl font-semibold",
		},
		variant: {
			default: "",
			muted: "text-muted-foreground",
			modifier: "text-muted-foreground text-sm",
		},
	},
	defaultVariants: {
		size: "md",
		variant: "default",
	},
});

type PriceProps = ComponentProps<"span"> &
	VariantProps<typeof priceVariants> & {
		/** Price in cents */
		cents: number;
		/** Show + prefix for modifiers */
		showPlus?: boolean;
	};

/**
 * Price display component.
 * Automatically formats cents to currency display.
 */
export function ShopPrice({
	cents,
	size,
	variant,
	showPlus,
	className,
	...props
}: PriceProps) {
	const formatted = formatPriceCents(cents);
	const display = showPlus && cents > 0 ? `+${formatted}` : formatted;

	return (
		<span
			className={cn(priceVariants({ size, variant }), className)}
			{...props}
		>
			{display}
		</span>
	);
}

/**
 * Price row for summaries (Subtotal, Tax, Total).
 */
export function ShopPriceRow({
	label,
	cents,
	variant = "default",
	className,
}: {
	label: string;
	cents: number;
	variant?: "default" | "total";
	className?: string;
}) {
	return (
		<div
			className={cn(
				"flex items-center justify-between",
				variant === "total" && "pt-2 border-t border-border",
				className,
			)}
		>
			<span
				className={cn(
					variant === "total"
						? "text-foreground font-medium"
						: "text-muted-foreground",
				)}
			>
				{label}
			</span>
			<ShopPrice
				cents={cents}
				size={variant === "total" ? "lg" : "md"}
				className={variant === "total" ? "" : "text-foreground"}
			/>
		</div>
	);
}

// =============================================================================
// BADGE
// =============================================================================

const badgeVariants = cva(
	"inline-flex items-center rounded-full text-xs font-medium",
	{
		variants: {
			variant: {
				default: "bg-muted text-muted-foreground px-2 py-0.5",
				accent: "bg-primary/10 text-primary px-2 py-0.5",
				success: "bg-success/10 text-success px-2 py-0.5",
				allergen: "bg-muted text-muted-foreground px-2 py-1",
			},
			size: {
				sm: "text-[10px] px-1.5 py-0.5",
				md: "text-xs px-2 py-0.5",
				lg: "text-xs px-2 py-1",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "md",
		},
	},
);

type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

/**
 * Badge component for tags, labels, and indicators.
 */
export function ShopBadge({ variant, size, className, ...props }: BadgeProps) {
	return (
		<span
			className={cn(badgeVariants({ variant, size }), className)}
			{...props}
		/>
	);
}

/**
 * "Required" badge for option groups.
 */
export function RequiredBadge({ className }: { className?: string }) {
	return (
		<ShopBadge variant="accent" className={className}>
			Required
		</ShopBadge>
	);
}

// =============================================================================
// STATUS INDICATOR
// =============================================================================

interface StatusIndicatorProps {
	isOpen: boolean;
	className?: string;
}

/**
 * Open/Closed status indicator with dot and text.
 */
export function ShopStatusIndicator({
	isOpen,
	className,
}: StatusIndicatorProps) {
	return (
		<div className={cn("flex items-center gap-1.5 text-sm", className)}>
			{isOpen ? (
				<>
					<span className="h-2 w-2 rounded-full bg-success" />
					<span className="text-success">Open now</span>
				</>
			) : (
				<>
					<span className="h-2 w-2 rounded-full border border-muted-foreground bg-transparent" />
					<span className="text-muted-foreground">Closed</span>
				</>
			)}
		</div>
	);
}

// =============================================================================
// BUTTON
// =============================================================================

const buttonVariants = cva(
	"inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
	{
		variants: {
			variant: {
				primary: "bg-primary text-primary-foreground hover:bg-primary/90",
				secondary:
					"bg-card text-foreground border border-border hover:bg-card/80",
				ghost: "text-foreground hover:bg-muted",
				outline:
					"border border-border text-muted-foreground hover:text-foreground hover:border-border",
			},
			size: {
				sm: "h-8 px-3 text-sm rounded-lg",
				md: "h-10 px-4 text-sm rounded-lg",
				lg: "h-12 px-6 text-base rounded-xl",
				icon: "h-10 w-10 rounded-lg",
				"icon-sm": "h-8 w-8 rounded-lg",
			},
		},
		defaultVariants: {
			variant: "primary",
			size: "md",
		},
	},
);

type ButtonProps = ComponentProps<"button"> &
	VariantProps<typeof buttonVariants>;

/**
 * Shop-themed button.
 */
export function ShopButton({
	variant,
	size,
	className,
	...props
}: ButtonProps) {
	return (
		<button
			type="button"
			className={cn(buttonVariants({ variant, size }), className)}
			{...props}
		/>
	);
}

const pillButtonVariants = cva(
	"inline-flex items-center justify-center whitespace-nowrap rounded-full font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
	{
		variants: {
			variant: {
				active: "bg-primary text-primary-foreground",
				inactive: "text-muted-foreground hover:text-foreground hover:bg-muted",
				outline:
					"border border-border bg-card text-muted-foreground hover:text-foreground",
			},
			size: {
				sm: "px-3 py-1.5 text-sm",
				md: "px-4 py-2 text-sm",
			},
		},
		defaultVariants: {
			variant: "inactive",
			size: "md",
		},
	},
);

type PillButtonProps = ComponentProps<"button"> &
	VariantProps<typeof pillButtonVariants> & {
		active?: boolean;
	};

/**
 * Pill-shaped button for filters, categories, and chips.
 */
export function ShopPillButton({
	variant,
	size,
	active,
	className,
	...props
}: PillButtonProps) {
	const resolvedVariant = active ? "active" : (variant ?? "inactive");
	return (
		<button
			type="button"
			className={cn(
				pillButtonVariants({ variant: resolvedVariant, size }),
				className,
			)}
			{...props}
		/>
	);
}

// =============================================================================
// CARD
// =============================================================================

const cardVariants = cva("bg-card rounded-xl transition-colors", {
	variants: {
		variant: {
			default: "",
			interactive:
				"cursor-pointer hover:bg-card/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
			elevated: "shadow-md",
		},
		padding: {
			none: "",
			sm: "p-3",
			md: "p-4",
			lg: "p-5",
		},
	},
	defaultVariants: {
		variant: "default",
		padding: "none",
	},
});

type CardProps = ComponentProps<"div"> & VariantProps<typeof cardVariants>;

/**
 * Card container component.
 */
export function ShopCard({ variant, padding, className, ...props }: CardProps) {
	return (
		<div
			className={cn(cardVariants({ variant, padding }), className)}
			{...props}
		/>
	);
}

// =============================================================================
// DIVIDER
// =============================================================================

interface DividerProps {
	variant?: "default" | "subtle";
	className?: string;
}

/**
 * Horizontal divider/separator.
 */
export function ShopDivider({ variant = "default", className }: DividerProps) {
	return (
		<hr
			className={cn(
				"border-t",
				variant === "subtle" ? "border-border/50" : "border-border",
				className,
			)}
		/>
	);
}

// =============================================================================
// IMAGE PLACEHOLDER
// =============================================================================

interface ImagePlaceholderProps {
	src?: string | null;
	alt: string;
	className?: string;
	aspectRatio?: "square" | "video" | "wide";
}

/**
 * Image container with gradient placeholder fallback.
 */
export function ShopImage({
	src,
	alt,
	className,
	aspectRatio = "square",
}: ImagePlaceholderProps) {
	const aspectClasses = {
		square: "aspect-square",
		video: "aspect-video",
		wide: "aspect-[4/3]",
	};

	return (
		<div
			className={cn(
				"overflow-hidden rounded-lg bg-gradient-to-br from-amber-50 to-orange-50",
				aspectClasses[aspectRatio],
				className,
			)}
		>
			{src && (
				<img src={src} alt={alt} className="h-full w-full object-cover" />
			)}
		</div>
	);
}

// =============================================================================
// FOCUS RING UTILITY
// =============================================================================

/**
 * Focus ring classes for consistent keyboard navigation styling.
 */
export const focusRing =
	"focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/**
 * Focus ring classes (inset variant, no offset).
 */
export const focusRingInset =
	"focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset";
