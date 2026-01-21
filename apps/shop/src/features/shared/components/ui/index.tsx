/**
 * Shop UI Primitives - Chakra UI v3
 *
 * Reusable UI components styled for the shop theme.
 * Migrated from CVA/Tailwind to Chakra UI.
 */

import {
	Badge,
	type BadgeProps,
	Box,
	type BoxProps,
	Button,
	type ButtonProps,
	Circle,
	Flex,
	type FlexProps,
	Heading,
	type HeadingProps,
	HStack,
	Image,
	Separator,
	Stack,
	type StackProps,
	Text,
	type TextProps,
} from "@chakra-ui/react";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { formatPrice as formatPriceCents } from "../../../utils";

// =============================================================================
// TYPOGRAPHY
// =============================================================================

type ShopHeadingSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

interface ShopHeadingProps extends Omit<HeadingProps, "size"> {
	size?: ShopHeadingSize;
}

/**
 * Shop heading component.
 * Use for all headings, titles, and item names.
 */
export const ShopHeading = forwardRef<HTMLHeadingElement, ShopHeadingProps>(
	({ size = "lg", ...props }, ref) => {
		return <Heading ref={ref} size={size} fontWeight="semibold" {...props} />;
	},
);
ShopHeading.displayName = "ShopHeading";

/**
 * Shop body text.
 * Use for descriptions and regular content.
 */
export function ShopText(props: TextProps) {
	return <Text color="fg" {...props} />;
}

/**
 * Muted/secondary text.
 * Use for descriptions, helper text, and less important content.
 */
export function ShopMutedText(props: TextProps) {
	return <Text color="fg.muted" {...props} />;
}

// =============================================================================
// PRICE
// =============================================================================

type PriceSize = "sm" | "md" | "lg" | "xl";
type PriceVariant = "default" | "muted" | "modifier";

interface ShopPriceProps extends Omit<TextProps, "size"> {
	/** Price in cents */
	cents: number;
	/** Size variant */
	size?: PriceSize;
	/** Style variant */
	variant?: PriceVariant;
	/** Show + prefix for modifiers */
	showPlus?: boolean;
}

/**
 * Price display component.
 * Automatically formats cents to currency display.
 */
export function ShopPrice({
	cents,
	size = "md",
	variant = "default",
	showPlus,
	...props
}: ShopPriceProps) {
	const formatted = formatPriceCents(cents);
	const display = showPlus && cents > 0 ? `+${formatted}` : formatted;

	const sizeStyles: Record<PriceSize, TextProps> = {
		sm: { textStyle: "sm" },
		md: { textStyle: "md" },
		lg: { textStyle: "lg", fontWeight: "semibold" },
		xl: { textStyle: "xl", fontWeight: "semibold" },
	};

	const variantStyles: Record<PriceVariant, TextProps> = {
		default: { color: "fg" },
		muted: { color: "fg.muted" },
		modifier: { color: "fg.muted", textStyle: "sm" },
	};

	return (
		<Text
			as="span"
			fontVariantNumeric="tabular-nums"
			{...sizeStyles[size]}
			{...variantStyles[variant]}
			{...props}
		>
			{display}
		</Text>
	);
}

interface ShopPriceRowProps extends FlexProps {
	label: string;
	cents: number;
	variant?: "default" | "total";
}

/**
 * Price row for summaries (Subtotal, Tax, Total).
 */
export function ShopPriceRow({
	label,
	cents,
	variant = "default",
	...props
}: ShopPriceRowProps) {
	const isTotal = variant === "total";

	return (
		<Flex
			justify="space-between"
			align="center"
			{...(isTotal && {
				borderTopWidth: "1px",
				borderColor: "border",
				pt: "2",
			})}
			{...props}
		>
			<Text
				color={isTotal ? "fg" : "fg.muted"}
				fontWeight={isTotal ? "medium" : "normal"}
			>
				{label}
			</Text>
			<ShopPrice cents={cents} size={isTotal ? "lg" : "md"} />
		</Flex>
	);
}

// =============================================================================
// BADGE
// =============================================================================

type ShopBadgeVariant = "default" | "accent" | "success" | "allergen";
type ShopBadgeSize = "sm" | "md" | "lg";

interface ShopBadgeProps extends Omit<BadgeProps, "variant" | "size"> {
	variant?: ShopBadgeVariant;
	size?: ShopBadgeSize;
}

/**
 * Badge component for tags, labels, and indicators.
 */
export function ShopBadge({
	variant = "default",
	size = "md",
	...props
}: ShopBadgeProps) {
	const variantStyles: Record<ShopBadgeVariant, BadgeProps> = {
		default: { colorPalette: "gray", variant: "subtle" },
		accent: { colorPalette: "teal", variant: "subtle" },
		success: { colorPalette: "green", variant: "subtle" },
		allergen: { colorPalette: "gray", variant: "subtle" },
	};

	const sizeStyles: Record<ShopBadgeSize, BadgeProps> = {
		sm: { px: "1.5", py: "0.5", fontSize: "10px" },
		md: { px: "2", py: "0.5", fontSize: "xs" },
		lg: { px: "2", py: "1", fontSize: "xs" },
	};

	return <Badge {...variantStyles[variant]} {...sizeStyles[size]} {...props} />;
}

/**
 * "Required" badge for option groups.
 */
export function RequiredBadge(
	props: Omit<ShopBadgeProps, "children" | "variant">,
) {
	const { t } = useTranslation("shop");

	return (
		<ShopBadge variant="accent" {...props}>
			{t("menu.options.required")}
		</ShopBadge>
	);
}

// =============================================================================
// STATUS INDICATOR
// =============================================================================

interface StatusIndicatorProps extends StackProps {
	isOpen: boolean;
}

/**
 * Open/Closed status indicator with dot and text.
 */
export function ShopStatusIndicator({
	isOpen,
	...props
}: StatusIndicatorProps) {
	const { t } = useTranslation("shop");

	return (
		<HStack gap="1.5" textStyle="sm" {...props}>
			{isOpen ? (
				<>
					<Circle size="2" bg="green.solid" />
					<Text color="fg.success">{t("status.openNow")}</Text>
				</>
			) : (
				<>
					<Circle
						size="2"
						borderWidth="1px"
						borderColor="fg.muted"
						bg="transparent"
					/>
					<Text color="fg.muted">{t("status.closed")}</Text>
				</>
			)}
		</HStack>
	);
}

// =============================================================================
// BUTTON
// =============================================================================

type ShopButtonVariant = "primary" | "secondary" | "ghost" | "outline";
type ShopButtonSize = "sm" | "md" | "lg" | "icon" | "icon-sm";

interface ShopButtonProps extends Omit<ButtonProps, "variant" | "size"> {
	variant?: ShopButtonVariant;
	size?: ShopButtonSize;
}

/**
 * Shop-themed button.
 */
export function ShopButton({
	variant = "primary",
	size = "md",
	...props
}: ShopButtonProps) {
	const variantStyles: Record<ShopButtonVariant, ButtonProps> = {
		primary: { colorPalette: "teal", variant: "solid" },
		secondary: { variant: "outline" },
		ghost: { variant: "ghost" },
		outline: { variant: "outline", color: "fg.muted" },
	};

	const sizeStyles: Record<ShopButtonSize, ButtonProps> = {
		sm: { h: "8", px: "3", rounded: "lg", textStyle: "sm" },
		md: { h: "10", px: "4", rounded: "lg", textStyle: "sm" },
		lg: { h: "12", px: "6", rounded: "xl", textStyle: "md" },
		icon: { h: "10", w: "10", p: "0", rounded: "lg" },
		"icon-sm": { h: "8", w: "8", p: "0", rounded: "lg" },
	};

	return (
		<Button {...variantStyles[variant]} {...sizeStyles[size]} {...props} />
	);
}

type PillButtonVariant = "active" | "inactive" | "outline";
type PillButtonSize = "sm" | "md";

interface ShopPillButtonProps extends Omit<ButtonProps, "variant" | "size"> {
	variant?: PillButtonVariant;
	size?: PillButtonSize;
	active?: boolean;
}

/**
 * Pill-shaped button for filters, categories, and chips.
 */
export function ShopPillButton({
	variant,
	size = "md",
	active,
	...props
}: ShopPillButtonProps) {
	const resolvedVariant = active ? "active" : (variant ?? "inactive");

	const variantStyles: Record<PillButtonVariant, ButtonProps> = {
		active: { colorPalette: "teal", variant: "solid" },
		inactive: {
			variant: "ghost",
			color: "fg.muted",
			_hover: { bg: "bg.muted", color: "fg" },
		},
		outline: {
			variant: "outline",
			color: "fg.muted",
			_hover: { color: "fg" },
		},
	};

	const sizeStyles: Record<PillButtonSize, ButtonProps> = {
		sm: { px: "3", py: "1.5", textStyle: "sm" },
		md: { px: "4", py: "2", textStyle: "sm" },
	};

	return (
		<Button
			rounded="lg"
			{...variantStyles[resolvedVariant]}
			{...sizeStyles[size]}
			{...props}
		/>
	);
}

// =============================================================================
// CARD
// =============================================================================

type CardVariant = "default" | "interactive" | "elevated";
type CardPadding = "none" | "sm" | "md" | "lg";

interface ShopCardProps extends BoxProps {
	variant?: CardVariant;
	padding?: CardPadding;
}

/**
 * Card container component.
 */
export function ShopCard({
	variant = "default",
	padding = "none",
	...props
}: ShopCardProps) {
	const variantStyles: Record<CardVariant, BoxProps> = {
		default: {},
		interactive: {
			cursor: "pointer",
			_hover: { bg: "bg.hover" },
			_focusVisible: {
				ring: "2px",
				ringColor: "teal.solid",
				ringOffset: "2px",
			},
		},
		elevated: { shadow: "md" },
	};

	const paddingStyles: Record<CardPadding, BoxProps> = {
		none: {},
		sm: { p: "3" },
		md: { p: "4" },
		lg: { p: "5" },
	};

	return (
		<Box
			rounded="lg"
			bg="bg.panel"
			transition="colors"
			{...variantStyles[variant]}
			{...paddingStyles[padding]}
			{...props}
		/>
	);
}

// =============================================================================
// CARD SECTION
// =============================================================================

interface CardSectionProps extends Omit<BoxProps, "title" | "padding"> {
	title: string;
	icon?: React.ComponentType;
	children: React.ReactNode;
}

/**
 * Section card with title and optional icon.
 * Consolidates the common pattern of ShopCard + Stack + ShopHeading.
 */
export function CardSection({
	title,
	icon,
	children,
	...props
}: CardSectionProps) {
	return (
		<ShopCard padding="md" {...props}>
			<Stack gap="4">
				{icon ? (
					<HStack gap="2">
						<Box as={icon} boxSize="5" color="teal.solid" />
						<ShopHeading as="h2" size="md">
							{title}
						</ShopHeading>
					</HStack>
				) : (
					<ShopHeading as="h2" size="md">
						{title}
					</ShopHeading>
				)}
				{children}
			</Stack>
		</ShopCard>
	);
}

// =============================================================================
// DIVIDER
// =============================================================================

interface ShopDividerProps {
	variant?: "default" | "subtle";
	className?: string;
}

/**
 * Horizontal divider/separator.
 */
export function ShopDivider({ variant = "default" }: ShopDividerProps) {
	return (
		<Separator borderColor={variant === "subtle" ? "border.muted" : "border"} />
	);
}

// =============================================================================
// IMAGE PLACEHOLDER
// =============================================================================

type AspectRatioType = "square" | "video" | "wide";

interface ShopImageProps extends BoxProps {
	src?: string | null;
	alt: string;
	aspectRatio?: AspectRatioType;
}

/**
 * Image container with gradient placeholder fallback.
 */
export function ShopImage({
	src,
	alt,
	aspectRatio = "square",
	...props
}: ShopImageProps) {
	const aspectStyles: Record<AspectRatioType, string> = {
		square: "1 / 1",
		video: "16 / 9",
		wide: "4 / 3",
	};

	return (
		<Box
			overflow="hidden"
			rounded="lg"
			bg="bg.muted"
			aspectRatio={aspectStyles[aspectRatio]}
			{...props}
		>
			{src && <Image src={src} alt={alt} objectFit="cover" w="full" h="full" />}
		</Box>
	);
}

// =============================================================================
// FOCUS RING - Chakra style props for keyboard navigation
// =============================================================================

/**
 * Focus ring style props for consistent keyboard navigation styling.
 * Use with Chakra components as spread props.
 */
export const focusRingProps = {
	_focusVisible: {
		outline: "none",
		ring: "2px",
		ringColor: "teal.solid",
		ringOffset: "2px",
	},
};

/**
 * Focus ring style props (inset variant, no offset).
 */
export const focusRingInsetProps = {
	_focusVisible: {
		outline: "none",
		ring: "2px",
		ringColor: "teal.solid",
		ringInset: true,
	},
};

/**
 * @deprecated Use focusRingProps instead for Chakra components.
 * Legacy CSS class string for components still using className.
 */
export const focusRing =
	"focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/**
 * @deprecated Use focusRingInsetProps instead for Chakra components.
 * Legacy CSS class string for components still using className.
 */
export const focusRingInset =
	"focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset";

// =============================================================================
// SECTION HEADER
// =============================================================================

export { SectionHeader } from "./section-header";

// =============================================================================
// PAGE CONTAINER
// =============================================================================

export {
	type ContainerSize,
	PageContainer,
	type PageContainerProps,
} from "./page-container";

// =============================================================================
// EMPTY STATE
// =============================================================================

export { EmptyState } from "./empty-state";
