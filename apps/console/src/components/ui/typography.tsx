import type { HeadingProps, TextProps } from "@chakra-ui/react";
import { Heading, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

/**
 * Typography Components
 *
 * Thin wrapper components that enforce consistent typography across the console.
 * These map to semantic textStyles defined in theme.ts.
 *
 * Usage:
 *   <PageTitle>Dashboard</PageTitle>
 *   <SectionTitle>Account Settings</SectionTitle>
 *   <Label>Email Address</Label>
 *   <Caption>This will be visible to other users</Caption>
 */

// ============================================================================
// PageTitle - H1 headings for page titles
// ============================================================================

interface PageTitleProps extends Omit<HeadingProps, "as" | "textStyle"> {
	children: ReactNode;
}

/**
 * Page title component for H1 headings.
 * Uses textStyle="pageTitle" (20px, semibold)
 */
export function PageTitle({ children, ...props }: PageTitleProps) {
	return (
		<Heading as="h1" textStyle="pageTitle" {...props}>
			{children}
		</Heading>
	);
}

// ============================================================================
// SectionTitle - H2 headings for section titles
// ============================================================================

interface SectionTitleProps extends Omit<HeadingProps, "as" | "textStyle"> {
	children: ReactNode;
}

/**
 * Section title component for H2 headings.
 * Uses textStyle="sectionTitle" (12px, bold, uppercase, letter-spacing)
 */
export function SectionTitle({ children, ...props }: SectionTitleProps) {
	return (
		<Heading as="h2" textStyle="sectionTitle" {...props}>
			{children}
		</Heading>
	);
}

// ============================================================================
// Label - Form labels and row labels
// ============================================================================

interface LabelProps extends Omit<TextProps, "textStyle" | "fontWeight"> {
	children: ReactNode;
	/** Whether the label should appear muted/secondary */
	muted?: boolean;
}

/**
 * Label component for form labels and settings row labels.
 * Uses textStyle="label" (14px, medium weight)
 *
 * @param muted - If true, uses muted color (fg.muted)
 */
export function Label({ children, muted, ...props }: LabelProps) {
	return (
		<Text textStyle={muted ? "label.muted" : "label"} {...props}>
			{children}
		</Text>
	);
}

// ============================================================================
// Caption - Helper text and descriptions
// ============================================================================

interface CaptionProps extends Omit<TextProps, "textStyle" | "color"> {
	children: ReactNode;
}

/**
 * Caption component for helper text, descriptions, and secondary information.
 * Uses textStyle="caption" (14px, muted color)
 */
export function Caption({ children, ...props }: CaptionProps) {
	return (
		<Text textStyle="caption" {...props}>
			{children}
		</Text>
	);
}

// ============================================================================
// Muted - Secondary text (alias for Caption, can be used inline)
// ============================================================================

interface MutedProps extends Omit<TextProps, "color"> {
	children: ReactNode;
}

/**
 * Muted text component for secondary information.
 * Unlike Caption, this doesn't enforce a specific textStyle,
 * making it useful for inline muted text within other textStyles.
 */
export function Muted({ children, ...props }: MutedProps) {
	return (
		<Text color="fg.muted" {...props}>
			{children}
		</Text>
	);
}
