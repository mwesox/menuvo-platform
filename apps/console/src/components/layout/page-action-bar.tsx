import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	Tabs,
	TabsList,
	TabsTrigger,
} from "@menuvo/ui";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Fragment } from "react";

interface TabItem {
	value: string;
	label: string;
}

interface BreadcrumbItemData {
	label: string;
	href?: string;
	search?: Record<string, string>;
}

interface PageActionBarProps {
	title?: string;
	backHref?: string;
	backLabel?: string;
	actions?: React.ReactNode;
	tabs?: {
		items: TabItem[];
		value: string;
		onChange: (value: string) => void;
	};
	/** Structured breadcrumb trail - last item is current page */
	breadcrumbs?: BreadcrumbItemData[];
}

export function PageActionBar({
	title,
	backHref,
	backLabel,
	actions,
	tabs,
	breadcrumbs,
}: PageActionBarProps) {
	const showBackButton = backHref && !breadcrumbs;
	const displayTitle = !breadcrumbs ? (title ?? backLabel) : undefined;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					{showBackButton && (
						<Button variant="ghost" size="icon" asChild>
							<Link to={backHref}>
								<ArrowLeft className="h-4 w-4" />
								<span className="sr-only">{backLabel ?? "Back"}</span>
							</Link>
						</Button>
					)}
					{breadcrumbs && breadcrumbs.length > 0 && (
						<Breadcrumb>
							<BreadcrumbList>
								{breadcrumbs.map((item, index) => (
									<Fragment key={item.href ?? item.label}>
										<BreadcrumbItem>
											{item.href ? (
												<BreadcrumbLink asChild>
													<Link to={item.href} search={item.search}>
														{item.label}
													</Link>
												</BreadcrumbLink>
											) : (
												<BreadcrumbPage>{item.label}</BreadcrumbPage>
											)}
										</BreadcrumbItem>
										{index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
									</Fragment>
								))}
							</BreadcrumbList>
						</Breadcrumb>
					)}
					{displayTitle && (
						<h1 className="font-semibold text-2xl tracking-tight">
							{displayTitle}
						</h1>
					)}
				</div>
				{actions && <div className="flex items-center gap-2">{actions}</div>}
			</div>
			{tabs && (
				<Tabs value={tabs.value} onValueChange={tabs.onChange}>
					<TabsList>
						{tabs.items.map((item) => (
							<TabsTrigger key={item.value} value={item.value}>
								{item.label}
							</TabsTrigger>
						))}
					</TabsList>
				</Tabs>
			)}
		</div>
	);
}
