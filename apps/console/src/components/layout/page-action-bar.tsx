import {
	Breadcrumb,
	Heading,
	HStack,
	IconButton,
	Tabs,
	VisuallyHidden,
	VStack,
} from "@chakra-ui/react";
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
	params?: Record<string, string>;
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
		<VStack gap="4" align="stretch">
			<HStack justify="space-between" align="center">
				<HStack gap="3" align="center">
					{showBackButton && (
						<IconButton
							variant="ghost"
							size="sm"
							asChild
							aria-label={backLabel ?? "Back"}
						>
							<Link to={backHref}>
								<ArrowLeft style={{ height: "1rem", width: "1rem" }} />
								<VisuallyHidden>{backLabel ?? "Back"}</VisuallyHidden>
							</Link>
						</IconButton>
					)}
					{breadcrumbs && breadcrumbs.length > 0 && (
						<Breadcrumb.Root>
							<Breadcrumb.List>
								{breadcrumbs.map((item, index) => (
									<Fragment key={item.href ?? item.label}>
										<Breadcrumb.Item>
											{item.href ? (
												<Breadcrumb.Link asChild>
													<Link
														to={item.href}
														params={item.params}
														search={item.search}
													>
														{item.label}
													</Link>
												</Breadcrumb.Link>
											) : (
												<Breadcrumb.CurrentLink>
													{item.label}
												</Breadcrumb.CurrentLink>
											)}
										</Breadcrumb.Item>
										{index < breadcrumbs.length - 1 && <Breadcrumb.Separator />}
									</Fragment>
								))}
							</Breadcrumb.List>
						</Breadcrumb.Root>
					)}
					{displayTitle && (
						<Heading
							as="h1"
							fontWeight="semibold"
							textStyle="2xl"
							letterSpacing="tight"
						>
							{displayTitle}
						</Heading>
					)}
				</HStack>
				{actions && (
					<HStack gap="2" align="center">
						{actions}
					</HStack>
				)}
			</HStack>
			{tabs && (
				<Tabs.Root
					value={tabs.value}
					onValueChange={(e) => tabs.onChange(e.value)}
				>
					<Tabs.List>
						{tabs.items.map((item) => (
							<Tabs.Trigger key={item.value} value={item.value}>
								{item.label}
							</Tabs.Trigger>
						))}
					</Tabs.List>
				</Tabs.Root>
			)}
		</VStack>
	);
}
