import { Button } from "@menuvo/ui/components/button";
import { Kbd } from "@menuvo/ui/components/kbd";
import { useIsMobile } from "@menuvo/ui/hooks/use-media-query";
import { cn } from "@menuvo/ui/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronLeft, Search, ShoppingCart, X } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
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
			<Button
				variant="ghost"
				size="icon"
				className="relative text-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
				onClick={handleClick}
				aria-label={t("header.cartWithItems", { count: itemCount })}
			>
				<ShoppingCart className="size-5" />
				{itemCount > 0 && (
					<span
						className="absolute -end-1 -top-1 flex size-5 items-center justify-center rounded-full font-medium text-xs"
						style={{
							backgroundColor: "var(--primary)",
							color: "var(--primary-foreground)",
						}}
					>
						{itemCount > 99 ? "99+" : itemCount}
					</span>
				)}
			</Button>

			{/* Desktop: full cart info */}
			<Button
				variant="ghost"
				className={cn(
					"hidden items-center gap-2 text-foreground hover:bg-accent hover:text-accent-foreground md:flex",
					itemCount > 0 && "pe-3",
				)}
				onClick={handleClick}
				aria-label={t("header.cartWithItems", { count: itemCount })}
			>
				<div className="relative flex items-center gap-1.5">
					<ShoppingCart className="size-5" />
					{itemCount > 0 && (
						<span
							className="flex size-4 items-center justify-center rounded-full font-semibold text-[10px] leading-none"
							style={{
								backgroundColor: "var(--primary)",
								color: "var(--primary-foreground)",
							}}
						>
							{itemCount > 99 ? "99+" : itemCount}
						</span>
					)}
				</div>
				{itemCount > 0 && (
					<span className="font-semibold text-sm tabular-nums">
						{formatPrice(subtotal)}
					</span>
				)}
			</Button>
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
		<div className="relative hidden md:block">
			<Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
			<input
				ref={inputRef}
				type="text"
				value={searchQuery}
				onChange={(e) => setSearchQuery?.(e.target.value)}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
				placeholder={t("header.searchPlaceholder")}
				className="h-9 w-56 min-w-48 rounded-lg border border-transparent bg-muted/50 ps-9 pe-16 text-foreground text-sm placeholder:text-muted-foreground focus:border-border focus:bg-background focus:outline-none md:w-64 lg:w-80 xl:w-96"
			/>
			{/* Keyboard shortcut hint or clear button */}
			<div className="absolute end-2 top-1/2 -translate-y-1/2">
				{searchQuery ? (
					<button
						type="button"
						onClick={() => setSearchQuery?.("")}
						className="rounded p-0.5 text-muted-foreground hover:text-foreground"
					>
						<X className="size-4" />
					</button>
				) : (
					!isFocused && (
						<Kbd
							className="bg-background text-foreground/80 shadow-sm"
							suppressHydrationWarning
						>
							{isMac === null ? "⌘" : isMac ? "⌘" : "Ctrl"} K
						</Kbd>
					)
				)}
			</div>
		</div>
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
		<Link
			to="/$slug"
			params={{ slug: store.slug }}
			className="group flex min-w-0 flex-col items-center md:flex-row md:gap-2"
		>
			{/* Store name - always visible, with editorial hover underline */}
			<span className="truncate font-semibold text-base text-foreground decoration-1 underline-offset-4 group-hover:underline">
				{store.name}
			</span>

			{/* Address - desktop only */}
			{storeAddress && (
				<div className="hidden items-center gap-2 md:flex">
					<span className="text-muted-foreground">·</span>
					<span className="truncate text-muted-foreground text-sm">
						{storeAddress}
					</span>
				</div>
			)}
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
		<header className="sticky top-0 z-50 border-b border-border bg-background">
			<div className="flex h-14 items-center gap-4 px-4">
				{/* Left: Context-aware back link */}
				{isDeepPage && slug ? (
					<Link
						to="/$slug"
						params={{ slug }}
						className="flex shrink-0 items-center gap-1 text-muted-foreground text-sm transition-colors hover:text-foreground"
					>
						<ChevronLeft className="size-4" />
						<span>{t("header.backToMenu")}</span>
					</Link>
				) : (
					<Link
						to="/"
						className="flex shrink-0 items-center gap-1 transition-opacity hover:opacity-80"
					>
						<ChevronLeft className="size-4 text-muted-foreground" />
						<img
							src="/menuvo-logo-horizontal.svg"
							alt="Menuvo"
							className="hidden h-8 sm:block"
						/>
					</Link>
				)}

				{/* Center: Store info - flexible space */}
				<div className="flex min-w-0 flex-1 justify-center">
					<StoreInfo />
				</div>

				{/* Right: Search + Cart */}
				<div className="flex shrink-0 items-center gap-2">
					<SearchInput />
					<CartButton onClick={openCartDrawer} />
				</div>
			</div>
		</header>
	);
}
