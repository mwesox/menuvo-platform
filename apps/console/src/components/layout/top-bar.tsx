import {
	Avatar,
	Box,
	Button,
	createListCollection,
	HStack,
	IconButton,
	Menu,
	Portal,
	Select,
	Skeleton,
	VisuallyHidden,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
	ChevronDown,
	HelpCircle,
	LogOut,
	Menu as MenuIcon,
	Store,
	User,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Logo } from "@/components/ui/logo";
import { useSidebar } from "@/contexts/sidebar-context";
import { useStoreSelection } from "@/contexts/store-selection-context";
import { useTRPC, useTRPCClient } from "@/lib/trpc";
import { LanguageSwitcher } from "./language-switcher";

function StoreSelector() {
	const { t } = useTranslation("navigation");
	const { stores, isLoading, selectedStoreId, selectStore } =
		useStoreSelection();

	if (isLoading) {
		return <Skeleton h="8" w="40" />;
	}

	const hasMultipleStores = stores.length > 1;
	const selectedStore = stores.find((s) => s.id === selectedStoreId);

	// No stores - show placeholder
	if (stores.length === 0) {
		return (
			<HStack
				h="8"
				gap="2"
				rounded="md"
				borderWidth="1px"
				borderStyle="dashed"
				borderColor="fg.muted"
				bg="bg.muted"
				px="3"
				color="fg.muted"
				textStyle="sm"
			>
				<Store style={{ height: "1rem", width: "1rem" }} />
				<Box>{t("noStores", "No stores")}</Box>
			</HStack>
		);
	}

	// Single store - read-only display
	if (!hasMultipleStores && selectedStore) {
		return (
			<HStack
				h="8"
				gap="2"
				rounded="md"
				borderWidth="1px"
				borderColor="input"
				bg="bg"
				px="3"
				textStyle="sm"
			>
				<Store
					style={{ height: "1rem", width: "1rem" }}
					color="var(--chakra-colors-fg-muted)"
				/>
				<Box maxW="80" truncate fontWeight="medium">
					{selectedStore.name}
				</Box>
			</HStack>
		);
	}

	// Multiple stores - selector
	const collection = createListCollection({
		items: stores.map((store) => ({ value: store.id, label: store.name })),
	});

	return (
		<Select.Root
			collection={collection}
			value={selectedStoreId ? [selectedStoreId] : []}
			onValueChange={(e) => selectStore(e.value[0] ?? "")}
		>
			<Select.HiddenSelect />
			<Select.Control>
				<Select.Trigger h="8" w="auto" minW="48" maxW="96" gap="2">
					<HStack flex="1" gap="2" overflow="hidden">
						<Store
							style={{ height: "1rem", width: "1rem", flexShrink: 0 }}
							color="var(--chakra-colors-fg-muted)"
						/>
						<Select.ValueText placeholder={t("selectStore", "Select store")} />
					</HStack>
					<Select.IndicatorGroup>
						<Select.Indicator />
					</Select.IndicatorGroup>
				</Select.Trigger>
			</Select.Control>
			<Portal>
				<Select.Positioner>
					<Select.Content>
						{collection.items.map((item) => (
							<Select.Item key={item.value} item={item}>
								{item.label}
								<Select.ItemIndicator />
							</Select.Item>
						))}
					</Select.Content>
				</Select.Positioner>
			</Portal>
		</Select.Root>
	);
}

function UserMenu() {
	const { t } = useTranslation("navigation");
	const { t: tToasts } = useTranslation("toasts");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();

	const logout = useMutation({
		...trpc.auth.logout.mutationOptions(),
		mutationFn: async () => {
			return trpcClient.auth.logout.mutate();
		},
		onSuccess: () => {
			queryClient.clear();
			toast.success(tToasts("success.loggedOut"));
		},
		onError: () => {
			toast.error(tToasts("error.logout"));
		},
	});

	return (
		<HStack gap="1" align="center">
			<IconButton variant="ghost" size="sm" h="8" w="8" asChild>
				<Link to="/help">
					<HelpCircle style={{ height: "1rem", width: "1rem" }} />
					<VisuallyHidden>{t("help", "Help")}</VisuallyHidden>
				</Link>
			</IconButton>

			<Menu.Root positioning={{ placement: "bottom-end" }}>
				<Menu.Trigger asChild>
					<Button variant="ghost" size="sm" h="8" gap="1" px="2">
						<Avatar.Root size="xs">
							<Avatar.Fallback>
								<User style={{ height: "0.875rem", width: "0.875rem" }} />
							</Avatar.Fallback>
						</Avatar.Root>
						<ChevronDown
							style={{ height: "0.75rem", width: "0.75rem" }}
							color="var(--chakra-colors-fg-muted)"
						/>
					</Button>
				</Menu.Trigger>
				<Portal>
					<Menu.Positioner>
						<Menu.Content w="48">
							<Menu.Item value="profile" asChild>
								<Link to="/settings" search={{ tab: "business" }}>
									<User
										style={{
											marginRight: "0.5rem",
											height: "1rem",
											width: "1rem",
										}}
									/>
									{t("profile", "Profile")}
								</Link>
							</Menu.Item>
							<Menu.Separator />
							<Menu.Item
								value="logout"
								color="fg.error"
								_hover={{ bg: "bg.error", color: "fg.error" }}
								onClick={() => logout.mutate()}
							>
								<LogOut
									style={{
										marginRight: "0.5rem",
										height: "1rem",
										width: "1rem",
									}}
								/>
								{t("logout", "Logout")}
							</Menu.Item>
						</Menu.Content>
					</Menu.Positioner>
				</Portal>
			</Menu.Root>
		</HStack>
	);
}

export function TopBar() {
	const { setOpenMobile } = useSidebar();

	return (
		<Box
			as="header"
			h="16"
			display="flex"
			alignItems="center"
			gap="4"
			px={{ base: "4", md: "6" }}
			borderBottomWidth="1px"
			borderColor="border.muted"
			bg="bg.panel"
			flexShrink={0}
		>
			{/* Mobile hamburger menu */}
			<IconButton
				variant="ghost"
				display={{ base: "flex", xl: "none" }}
				onClick={() => setOpenMobile(true)}
				aria-label="Open sidebar"
			>
				<MenuIcon style={{ height: "1.25rem", width: "1.25rem" }} />
			</IconButton>

			{/* Logo */}
			<Link to="/">
				<Logo height={28} />
			</Link>

			{/* Store selector */}
			<StoreSelector />

			{/* Spacer */}
			<Box flex="1" />

			{/* Language switcher + Help + User menu */}
			<HStack gap="1">
				<LanguageSwitcher />
				<UserMenu />
			</HStack>
		</Box>
	);
}
