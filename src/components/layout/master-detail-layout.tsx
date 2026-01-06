import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import type { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

type MasterWidth = "narrow" | "default" | "wide";

const masterWidthClasses: Record<MasterWidth, string> = {
	narrow: "w-[280px]",
	default: "w-[320px] xl:w-[360px]",
	wide: "w-[360px] xl:w-[400px]",
};

interface MasterDetailLayoutProps {
	/** Content for the master (list) panel */
	master: ReactNode;
	/** Content for the detail panel */
	detail: ReactNode;
	/** Width of master panel on desktop */
	masterWidth?: MasterWidth;
	/** Whether an item is selected (controls sheet visibility on mobile) */
	hasSelection: boolean;
	/** Callback when detail panel/sheet is closed */
	onDetailClose?: () => void;
	/** Title shown in mobile sheet header */
	sheetTitle?: string;
	/** Additional className for the root container */
	className?: string;
}

/**
 * A responsive master-detail layout component.
 *
 * - Desktop (lg+): Side-by-side panels with master list on left, detail on right
 * - Mobile (<lg): Full-width master list with detail in bottom sheet
 *
 * @example
 * ```tsx
 * <MasterDetailLayout
 *   master={<CategoryList items={categories} onSelect={setSelected} />}
 *   detail={selectedId ? <CategoryDetail id={selectedId} /> : <EmptyState />}
 *   hasSelection={!!selectedId}
 *   onDetailClose={() => setSelected(null)}
 *   sheetTitle="Category Details"
 * />
 * ```
 */
export function MasterDetailLayout({
	master,
	detail,
	masterWidth = "default",
	hasSelection,
	onDetailClose,
	sheetTitle,
	className,
}: MasterDetailLayoutProps) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<div className={cn("flex flex-1 flex-col min-h-0", className)}>
				<ScrollArea className="flex-1">{master}</ScrollArea>
				<Sheet
					open={hasSelection}
					onOpenChange={(open) => !open && onDetailClose?.()}
				>
					<SheetContent side="bottom" className="h-[85vh] flex flex-col">
						{sheetTitle ? (
							<SheetHeader>
								<SheetTitle>{sheetTitle}</SheetTitle>
							</SheetHeader>
						) : (
							<VisuallyHidden.Root>
								<SheetTitle>Details</SheetTitle>
							</VisuallyHidden.Root>
						)}
						<ScrollArea className="flex-1 -mx-4 px-4">{detail}</ScrollArea>
					</SheetContent>
				</Sheet>
			</div>
		);
	}

	return (
		<div className={cn("flex flex-1 gap-6 min-h-0", className)}>
			{/* Master panel */}
			<div
				className={cn(
					"flex-shrink-0 border-r border-border pe-6",
					masterWidthClasses[masterWidth],
				)}
			>
				<ScrollArea className="h-full">{master}</ScrollArea>
			</div>

			{/* Detail panel */}
			<div className="flex-1 min-w-0">
				<ScrollArea className="h-full">{detail}</ScrollArea>
			</div>
		</div>
	);
}
