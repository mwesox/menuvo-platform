import { Box, Drawer, Flex, Portal, Skeleton } from "@chakra-ui/react";
import { Outlet } from "@tanstack/react-router";
import { Suspense } from "react";
import { SidebarProvider, useSidebar } from "@/contexts/sidebar-context";
import { StoreSelectionProvider } from "@/contexts/store-selection-context";
import { Footer } from "./footer";
import { AppSidebar } from "./sidebar";
import { TopBar } from "./top-bar";

function ConsoleLayoutInner() {
	const { openMobile, setOpenMobile } = useSidebar();

	return (
		<Flex direction="column" h="100vh">
			{/* Full-width top bar */}
			<TopBar />

			{/* Middle section: sidebar + content */}
			<Flex flex="1" overflow="hidden">
				{/* Desktop sidebar */}
				<Box display={{ base: "none", xl: "block" }}>
					<AppSidebar />
				</Box>

				{/* Mobile drawer */}
				<Drawer.Root
					open={openMobile}
					onOpenChange={(e) => setOpenMobile(e.open)}
					placement="start"
				>
					<Portal>
						<Drawer.Backdrop />
						<Drawer.Positioner>
							<Drawer.Content>
								<Drawer.Body p="0">
									<AppSidebar />
								</Drawer.Body>
							</Drawer.Content>
						</Drawer.Positioner>
					</Portal>
				</Drawer.Root>

				{/* Content area */}
				<Box
					as="main"
					flex="1"
					overflow="auto"
					p={{ base: "4", md: "6" }}
					pt={{ base: "4", md: "4" }}
					minW="0"
				>
					<Suspense fallback={<Skeleton h="12" rounded="md" />}>
						<Outlet />
					</Suspense>
				</Box>
			</Flex>

			{/* Full-width footer */}
			<Footer />
		</Flex>
	);
}

export function ConsoleLayout() {
	return (
		<StoreSelectionProvider>
			<SidebarProvider>
				<ConsoleLayoutInner />
			</SidebarProvider>
		</StoreSelectionProvider>
	);
}
