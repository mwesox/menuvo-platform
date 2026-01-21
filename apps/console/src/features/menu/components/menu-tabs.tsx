import { Box, Tabs } from "@chakra-ui/react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useStore } from "@/contexts/store-context";

export function MenuTabs() {
	const { t } = useTranslation("menu");
	const routerState = useRouterState();
	const currentPath = routerState.location.pathname;
	const store = useStore();
	const navigate = useNavigate();

	const basePath = `/stores/${store.id}/menu`;

	const isCategories =
		currentPath === basePath ||
		currentPath === `${basePath}/` ||
		currentPath.includes(`${basePath}/categories`);
	const isOptions = currentPath.includes(`${basePath}/options`);
	const isVat = currentPath.includes(`${basePath}/vat`);
	const isImport = currentPath.includes(`${basePath}/import`);

	// Determine active tab value based on current route
	const activeValue = isCategories
		? "categories"
		: isOptions
			? "options"
			: isVat
				? "vat"
				: isImport
					? "import"
					: "categories";

	const handleTabChange = (details: { value: string }) => {
		const routes: Record<string, string> = {
			categories: `/stores/${store.id}/menu`,
			options: `/stores/${store.id}/menu/options`,
			vat: `/stores/${store.id}/menu/vat`,
			import: `/stores/${store.id}/menu/import`,
		};
		const route = routes[details.value];
		if (route) {
			navigate({ to: route });
		}
	};

	return (
		<Tabs.Root
			value={activeValue}
			variant="line"
			onValueChange={handleTabChange}
		>
			<Box
				overflowX="auto"
				css={{ "&::-webkit-scrollbar": { display: "none" } }}
			>
				<Tabs.List flexWrap="nowrap" minW="max-content">
					<Tabs.Trigger value="categories">
						{t("titles.categories")}
					</Tabs.Trigger>
					<Tabs.Trigger value="options">
						{t("titles.optionGroups")}
					</Tabs.Trigger>
					<Tabs.Trigger value="vat">{t("vat.titles.vatGroups")}</Tabs.Trigger>
					<Tabs.Trigger value="import">{t("titles.aiDataImport")}</Tabs.Trigger>
				</Tabs.List>
			</Box>
		</Tabs.Root>
	);
}
