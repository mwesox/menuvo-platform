import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface MenuBreadcrumbProps {
	storeId: string;
	category?: { id: string; name: string };
	item?: { id: string; name: string };
	/** Current page title (e.g., "New Category", "Edit") */
	currentPage?: string;
}

export function MenuBreadcrumb({
	storeId,
	category,
	item,
	currentPage,
}: MenuBreadcrumbProps) {
	const { t } = useTranslation("menu");

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{/* Menu root - always shown */}
				<BreadcrumbItem>
					{!category && !currentPage ? (
						<BreadcrumbPage>{t("pageTitle")}</BreadcrumbPage>
					) : (
						<BreadcrumbLink asChild>
							<Link to="/console/menu" search={{ storeId }}>
								{t("pageTitle")}
							</Link>
						</BreadcrumbLink>
					)}
				</BreadcrumbItem>

				{/* Category level */}
				{category && (
					<>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							{!item && !currentPage ? (
								<BreadcrumbPage>{category.name}</BreadcrumbPage>
							) : (
								<BreadcrumbLink asChild>
									<Link
										to="/console/menu/categories/$categoryId"
										params={{ categoryId: category.id }}
										search={{ storeId }}
									>
										{category.name}
									</Link>
								</BreadcrumbLink>
							)}
						</BreadcrumbItem>
					</>
				)}

				{/* Item level */}
				{item && (
					<>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							{!currentPage ? (
								<BreadcrumbPage>{item.name}</BreadcrumbPage>
							) : (
								<BreadcrumbLink asChild>
									<Link
										to="/console/menu/categories/$categoryId/items/$itemId"
										params={{ categoryId: category?.id ?? "", itemId: item.id }}
										search={{ storeId }}
									>
										{item.name}
									</Link>
								</BreadcrumbLink>
							)}
						</BreadcrumbItem>
					</>
				)}

				{/* Current page (New, Edit, etc.) */}
				{currentPage && (
					<>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>{currentPage}</BreadcrumbPage>
						</BreadcrumbItem>
					</>
				)}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
