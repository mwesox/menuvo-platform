import { cn, Sheet, SheetContent, SheetHeader, SheetTitle } from "@menuvo/ui";

interface MasterDetailLayoutProps {
	master: React.ReactNode;
	detail: React.ReactNode;
	masterWidth?: "narrow" | "wide";
	hasSelection?: boolean;
	onDetailClose?: () => void;
	sheetTitle?: string;
}

export function MasterDetailLayout({
	master,
	detail,
	masterWidth = "narrow",
	hasSelection = false,
	onDetailClose,
	sheetTitle,
}: MasterDetailLayoutProps) {
	return (
		<div className="flex h-full gap-6">
			{/* Master panel */}
			<div
				className={cn(
					"flex-shrink-0 overflow-auto",
					masterWidth === "wide" ? "w-full lg:w-1/2" : "w-full lg:w-1/3",
				)}
			>
				{master}
			</div>

			{/* Detail panel - desktop */}
			<div className="hidden flex-1 overflow-auto lg:block">{detail}</div>

			{/* Detail panel - mobile sheet */}
			<Sheet
				open={hasSelection}
				onOpenChange={(open) => !open && onDetailClose?.()}
			>
				<SheetContent side="right" className="w-full sm:max-w-lg lg:hidden">
					<SheetHeader>
						<SheetTitle>{sheetTitle ?? "Details"}</SheetTitle>
					</SheetHeader>
					<div className="mt-4 overflow-auto">{detail}</div>
				</SheetContent>
			</Sheet>
		</div>
	);
}
