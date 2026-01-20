import { Button } from "@menuvo/ui";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface SidebarPageLayoutProps {
	/** URL to navigate back to (optional - hides back button if not provided) */
	backHref?: string;
	/** Label for the back button */
	backLabel?: string;
	/** Navigation sidebar content */
	nav: ReactNode;
	/** Main content area */
	children: ReactNode;
	/** Footer with save/cancel buttons - renders at bottom of content */
	footer?: ReactNode;
}

export function SidebarPageLayout({
	backHref,
	backLabel,
	nav,
	children,
	footer,
}: SidebarPageLayoutProps) {
	const showBackButton = backHref && backLabel;

	return (
		<div className="flex min-h-[calc(100vh-4rem)] flex-col">
			{/* Back button header - only show if backHref provided */}
			{showBackButton && (
				<div className="border-b px-6 py-4">
					<Button variant="ghost" size="sm" asChild>
						<Link to={backHref}>
							<ArrowLeft className="me-2 h-4 w-4" />
							{backLabel}
						</Link>
					</Button>
				</div>
			)}

			{/* Two-column layout */}
			<div className="flex flex-1 flex-col lg:flex-row">
				{/* Navigation sidebar - desktop */}
				<aside className="hidden w-60 shrink-0 border-e bg-muted/30 lg:block">
					<div className="sticky top-0 p-4">{nav}</div>
				</aside>

				{/* Mobile navigation - horizontal scroll */}
				<div className="w-full border-b px-3 py-2 lg:hidden">
					<div className="-mx-3 overflow-x-auto px-3 scrollbar-hide">{nav}</div>
				</div>

				{/* Main content */}
				<main className="flex-1">
					<div className="px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
						<div className="space-y-8">{children}</div>

						{/* Footer - inside content area */}
						{footer && (
							<div className="mt-8 border-t pt-6">
								<div className="flex justify-end gap-3">{footer}</div>
							</div>
						)}
					</div>
				</main>
			</div>
		</div>
	);
}
