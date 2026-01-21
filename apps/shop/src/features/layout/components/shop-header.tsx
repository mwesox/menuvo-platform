import {
	Box,
	Flex,
	HStack,
	IconButton,
	Image,
	Input,
	Kbd,
	Text,
} from "@chakra-ui/react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuChevronLeft, LuSearch, LuShoppingCart, LuX } from "react-icons/lu";
import { useCartStore } from "../../cart/stores/cart-store";
import { StoreContext, useShopUIStore } from "../../shared";
import { formatPrice } from "../../utils";

/** Detect if user is on Mac for keyboard shortcut display */
function useIsMac() {
	// Start with null to match SSR, update after hydration
	const [isMac, setIsMac] = useState<boolean | null>(null);

	useEffect(() => {
		// Check localStorage first for instant display on repeat visits
		const stored = localStorage.getItem("menuvo-platform");
		if (stored === "mac" || stored === "other") {
			setIsMac(stored === "mac");
		}
		// Always detect and persist for future visits
		const detected = navigator.platform.toUpperCase().includes("MAC");
		localStorage.setItem("menuvo-platform", detected ? "mac" : "other");
		setIsMac(detected);
	}, []);

	return isMac;
}

/** Simple mobile detection hook */
function useIsMobile() {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 768);
		};
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => window.removeEventListener("resize", checkMobile);
	}, []);

	return isMobile;
}

function CartButton({ onClick }: { onClick: () => void }) {
	const { t } = useTranslation("shop");
	const isMobile = useIsMobile();
	const items = useCartStore((s) => s.items);
	const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
	const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
	const toggleCartSidebar = useShopUIStore((s) => s.toggleCartSidebar);

	const handleClick = () => {
		if (isMobile) {
			// Mobile: open drawer
			onClick();
		} else {
			// Desktop: toggle sidebar collapse
			toggleCartSidebar();
		}
	};

	return (
		<>
			{/* Mobile: icon only */}
			<IconButton
				variant="ghost"
				size="sm"
				color="fg"
				display={{ base: "flex", md: "none" }}
				onClick={handleClick}
				aria-label={t("header.cartWithItems", { count: itemCount })}
				position="relative"
			>
				<LuShoppingCart style={{ width: "1.25rem", height: "1.25rem" }} />
				{itemCount > 0 && (
					<Box
						as="span"
						position="absolute"
						top="-1"
						right="-1"
						display="flex"
						alignItems="center"
						justifyContent="center"
						w="5"
						h="5"
						rounded="full"
						bg="colorPalette.solid"
						color="colorPalette.contrast"
						fontSize="xs"
						fontWeight="medium"
						colorPalette="teal"
					>
						{itemCount > 99 ? "99+" : itemCount}
					</Box>
				)}
			</IconButton>

			{/* Desktop: full cart info */}
			<IconButton
				variant="ghost"
				color="fg"
				display={{ base: "none", md: "flex" }}
				onClick={handleClick}
				aria-label={t("header.cartWithItems", { count: itemCount })}
				pe={itemCount > 0 ? "3" : undefined}
				w="auto"
				gap="2"
			>
				<Flex align="center" gap="1.5" position="relative">
					<LuShoppingCart style={{ width: "1.25rem", height: "1.25rem" }} />
					{itemCount > 0 && (
						<Box
							as="span"
							display="flex"
							alignItems="center"
							justifyContent="center"
							w="4"
							h="4"
							rounded="full"
							bg="colorPalette.solid"
							color="colorPalette.contrast"
							fontSize="10px"
							fontWeight="semibold"
							lineHeight="1"
							colorPalette="teal"
						>
							{itemCount > 99 ? "99+" : itemCount}
						</Box>
					)}
				</Flex>
				{itemCount > 0 && (
					<Text
						as="span"
						fontWeight="semibold"
						fontSize="sm"
						fontVariantNumeric="tabular-nums"
					>
						{formatPrice(subtotal)}
					</Text>
				)}
			</IconButton>
		</>
	);
}

function SearchInput() {
	const { t } = useTranslation("shop");
	const searchQuery = useShopUIStore((s) => s.searchQuery);
	const setSearchQuery = useShopUIStore((s) => s.setSearchQuery);
	const inputRef = useRef<HTMLInputElement>(null);
	const isMac = useIsMac();
	const [isFocused, setIsFocused] = useState(false);

	// Keyboard shortcut: Cmd+K (Mac) or Ctrl+K (Windows/Linux)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				inputRef.current?.focus();
			}
			// Escape to blur
			if (e.key === "Escape" && document.activeElement === inputRef.current) {
				inputRef.current?.blur();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, []);

	// Always render - context should always be available in shop routes
	return (
		<Box position="relative" display={{ base: "none", md: "block" }}>
			<Box
				as={LuSearch}
				position="absolute"
				left="3"
				top="50%"
				transform="translateY(-50%)"
				w="4"
				h="4"
				color="fg.muted"
			/>
			<Input
				ref={inputRef}
				type="text"
				value={searchQuery}
				onChange={(e) => setSearchQuery?.(e.target.value)}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
				placeholder={t("header.searchPlaceholder")}
				h="9"
				w={{ md: "64", lg: "80", xl: "96" }}
				minW="48"
				rounded="lg"
				borderColor="transparent"
				bg="bg.muted/50"
				ps="9"
				pe="16"
				color="fg"
				fontSize="sm"
				_placeholder={{ color: "fg.muted" }}
				_focus={{
					borderColor: "border",
					bg: "bg",
					outline: "none",
				}}
			/>
			{/* Keyboard shortcut hint or clear button */}
			<Box position="absolute" right="2" top="50%" transform="translateY(-50%)">
				{searchQuery ? (
					<IconButton
						variant="ghost"
						size="xs"
						onClick={() => setSearchQuery?.("")}
						color="fg.muted"
						_hover={{ color: "fg" }}
						aria-label="Clear search"
					>
						<LuX style={{ width: "1rem", height: "1rem" }} />
					</IconButton>
				) : (
					!isFocused && (
						<Kbd bg="bg" color="fg/80" shadow="sm" suppressHydrationWarning>
							{isMac === null ? "\u2318" : isMac ? "\u2318" : "Ctrl"} K
						</Kbd>
					)
				)}
			</Box>
		</Box>
	);
}

/** Detect if on a deep page (ordering, order) where we should show "Back to Menu" */
function useIsDeepPage() {
	const routerState = useRouterState();
	const pathname = routerState.location.pathname;
	// Check if we're on ordering or order pages (not the main menu)
	return pathname.includes("/ordering") || pathname.includes("/order/");
}

function StoreInfo() {
	const storeContext = useContext(StoreContext);
	const store = storeContext?.store ?? null;

	if (!store) {
		return null;
	}

	const addressParts = [store.street, store.city].filter(Boolean);
	const storeAddress = addressParts.join(", ") || null;

	return (
		<Link to="/$slug" params={{ slug: store.slug }}>
			<Flex
				direction={{ base: "column", md: "row" }}
				align="center"
				gap={{ md: "2" }}
				minW="0"
				role="group"
			>
				{/* Store name - always visible, with editorial hover underline */}
				<Text
					as="span"
					truncate
					fontWeight="semibold"
					fontSize="md"
					color="fg"
					textDecoration="none"
					_groupHover={{ textDecoration: "underline" }}
					textDecorationThickness="1px"
					textUnderlineOffset="4px"
				>
					{store.name}
				</Text>

				{/* Address - desktop only */}
				{storeAddress && (
					<HStack display={{ base: "none", md: "flex" }} gap="2">
						<Text as="span" color="fg.muted">
							&middot;
						</Text>
						<Text as="span" truncate color="fg.muted" fontSize="sm">
							{storeAddress}
						</Text>
					</HStack>
				)}
			</Flex>
		</Link>
	);
}

export function ShopHeader() {
	const { t } = useTranslation("shop");
	const openCartDrawer = useShopUIStore((s) => s.openCartDrawer);
	const storeContext = useContext(StoreContext);
	const store = storeContext?.store ?? null;
	const slug = store?.slug;
	const isDeepPage = useIsDeepPage();

	return (
		<Box
			as="header"
			position="sticky"
			top="0"
			zIndex="50"
			borderBottomWidth="1px"
			borderColor="border"
			bg="bg"
		>
			<Flex h="14" align="center" gap="4" px="4">
				{/* Left: Context-aware back link */}
				{isDeepPage && slug ? (
					<Link to="/$slug" params={{ slug }}>
						<HStack
							gap="1"
							color="fg.muted"
							fontSize="sm"
							transition="colors"
							_hover={{ color: "fg" }}
							flexShrink="0"
						>
							<LuChevronLeft style={{ width: "1rem", height: "1rem" }} />
							<Text as="span">{t("header.backToMenu")}</Text>
						</HStack>
					</Link>
				) : (
					<Link to="/">
						<HStack
							gap="1"
							flexShrink="0"
							transition="opacity"
							_hover={{ opacity: 0.8 }}
						>
							<Box as={LuChevronLeft} w="4" h="4" color="fg.muted" />
							<Image
								src="/menuvo-logo-horizontal.svg"
								alt="Menuvo"
								h="8"
								display={{ base: "none", sm: "block" }}
							/>
						</HStack>
					</Link>
				)}

				{/* Center: Store info - flexible space */}
				<Flex minW="0" flex="1" justify="center">
					<StoreInfo />
				</Flex>

				{/* Right: Search + Cart */}
				<HStack gap="2" flexShrink="0">
					<SearchInput />
					<CartButton onClick={openCartDrawer} />
				</HStack>
			</Flex>
		</Box>
	);
}
