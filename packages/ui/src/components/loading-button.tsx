import type { VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type * as React from "react";
import { Button, type buttonVariants } from "./button";

interface LoadingButtonProps
	extends React.ComponentProps<"button">,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	isLoading?: boolean;
	loadingText?: string;
}

/**
 * A button that shows a loading spinner and optional loading text when isLoading is true.
 * Automatically disables the button during loading.
 */
export function LoadingButton({
	isLoading = false,
	loadingText,
	disabled,
	children,
	...props
}: LoadingButtonProps) {
	return (
		<Button disabled={disabled || isLoading} {...props}>
			{isLoading ? (
				<>
					<Loader2 className="h-4 w-4 animate-spin" />
					{loadingText ?? children}
				</>
			) : (
				children
			)}
		</Button>
	);
}
