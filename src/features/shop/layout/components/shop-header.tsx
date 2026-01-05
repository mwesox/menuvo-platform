import { useQuery } from "@tanstack/react-query";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronLeft, Search, ShoppingCart, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import { useCartStore } from "../../cart/stores/cart-store";
import { shopQueries } from "../../queries";
import { useShopOptional } from "../../shared/contexts/shop-context";
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
	const items = useCartStore((s) => s.items);
	const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
	const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

	return (
		<>
			{/* Mobile: icon only */}
			<Button
				variant="ghost"
				size="icon"
				className="relative text-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
				onClick={onClick}
				aria-label={t("header.cartWithItems", { count: itemCount })}
			>
				<ShoppingCart className="size-5" />
				{itemCount > 0 && (
					<span
						className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full text-xs font-medium"
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
					"hidden md:flex items-center gap-2 text-foreground hover:bg-accent hover:text-accent-foreground",
					itemCount > 0 && "pr-3",
				)}
				onClick={onClick}
				aria-label={t("header.cartWithItems", { count: itemCount })}
			>
				<ShoppingCart className="size-5" />
				{itemCount > 0 && (
					<>
						<span className="text-sm font-medium">
							{t("header.itemCount", { count: itemCount })}
						</span>
						<span className="opacity-60">·</span>
						<span className="text-sm font-semibold tabular-nums">
							{formatPrice(subtotal)}
						</span>
					</>
				)}
			</Button>
		</>
	);
}

function SearchInput() {
	const { t } = useTranslation("shop");
	const shop = useShopOptional();
	const inputRef = useRef<HTMLInputElement>(null);
	const isMac = useIsMac();
	const [isFocused, setIsFocused] = useState(false);

	const searchQuery = shop?.searchQuery ?? "";
	const setSearchQuery = shop?.setSearchQuery;

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
			<Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
			<input
				ref={inputRef}
				type="text"
				value={searchQuery}
				onChange={(e) => setSearchQuery?.(e.target.value)}
				onFocus={() => setIsFocused(true)}
				onBlur={() => setIsFocused(false)}
				placeholder={t("header.searchPlaceholder")}
				className="h-9 min-w-48 w-64 lg:w-80 xl:w-96 rounded-lg border border-transparent bg-muted/50 pl-9 pr-16 text-sm text-foreground placeholder:text-muted-foreground focus:border-border focus:bg-background focus:outline-none"
			/>
			{/* Keyboard shortcut hint or clear button */}
			<div className="absolute right-2 top-1/2 -translate-y-1/2">
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

/** Extract slug from current route if on a store page */
function useStoreSlug() {
	const routerState = useRouterState();
	const matches = routerState.matches;
	// Find the $slug route match
	const slugMatch = matches.find((m) => m.routeId === "/$slug");
	return (slugMatch?.params as { slug?: string })?.slug ?? null;
}

/** Detect if on a deep page (checkout, order) where we should show "Back to Menu" */
function useIsDeepPage() {
	const routerState = useRouterState();
	const pathname = routerState.location.pathname;
	// Check if we're on checkout or order pages (not the main menu)
	return pathname.includes("/checkout") || pathname.includes("/order/");
}

function StoreInfo() {
	const { t } = useTranslation("shop");
	const slug = useStoreSlug();

	// Use the same query as the child route - data will be cached
	const { data: store } = useQuery({
		...shopQueries.storeBySlug(slug ?? ""),
		enabled: !!slug,
	});

	if (!store || !slug) {
		return null;
	}

	const addressParts = [store.street, store.city].filter(Boolean);
	const storeAddress = addressParts.join(", ") || null;

	return (
		<Link
			to="/$slug"
			params={{ slug }}
			className="group flex min-w-0 flex-col items-center md:flex-row md:gap-2"
		>
			{/* Store name - always visible, with editorial hover underline */}
			<span className="truncate font-serif text-base font-medium text-foreground decoration-1 underline-offset-4 group-hover:underline">
				{store.name}
			</span>

			{/* Mobile closed indicator - only when closed */}
			{store.isOpen === false && (
				<span className="flex items-center gap-1 text-xs text-destructive md:hidden">
					<span className="size-1.5 rounded-full bg-destructive" />
					{t("status.closed")}
				</span>
			)}

			{/* Address + Status - desktop only */}
			<div className="hidden items-center gap-2 md:flex">
				{storeAddress && (
					<>
						<span className="text-muted-foreground">·</span>
						<span className="truncate text-sm text-muted-foreground">
							{storeAddress}
						</span>
					</>
				)}
				{store.isOpen !== null && (
					<>
						<span className="text-muted-foreground">·</span>
						<span
							className={cn(
								"flex items-center gap-1.5 text-sm",
								store.isOpen ? "text-success" : "text-destructive",
							)}
						>
							<span
								className={cn(
									"size-1.5 rounded-full",
									store.isOpen ? "bg-success" : "bg-destructive",
								)}
							/>
							{store.isOpen ? t("status.openNow") : t("status.closed")}
						</span>
					</>
				)}
			</div>
		</Link>
	);
}

export function ShopHeader() {
	const { t } = useTranslation("shop");
	const shop = useShopOptional();
	const slug = useStoreSlug();
	const isDeepPage = useIsDeepPage();

	return (
		<header
			className="sticky top-0 z-50 border-b backdrop-blur-md"
			style={{
				backgroundColor: "oklch(0.988 0.003 90 / 0.95)",
				borderColor: "var(--border)",
			}}
		>
			<div className="flex h-14 items-center gap-4 px-4">
				{/* Left: Context-aware back link */}
				{isDeepPage && slug ? (
					<Link
						to="/$slug"
						params={{ slug }}
						className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
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
					<CartButton onClick={() => shop?.openCartDrawer()} />
				</div>
			</div>
		</header>
	);
}
