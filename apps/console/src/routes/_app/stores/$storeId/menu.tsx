import { VStack } from "@chakra-ui/react";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ConsoleError } from "@/features/components/console-error";
import { MenuTabs } from "@/features/menu/components/menu-tabs";

export const Route = createFileRoute("/_app/stores/$storeId/menu")({
	component: MenuLayout,
	errorComponent: ConsoleError,
});

function MenuLayout() {
	return (
		<VStack gap="6" align="stretch">
			<MenuTabs />
			<Outlet />
		</VStack>
	);
}
