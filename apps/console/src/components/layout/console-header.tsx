import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Skeleton,
} from "@menuvo/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronDown, HelpCircle, LogOut, Store, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useStoreSelection } from "@/contexts/store-selection-context";
import { useTRPC, useTRPCClient } from "@/lib/trpc";

function StoreSelector() {
	const { t } = useTranslation("navigation");
	const { stores, isLoading, selectedStoreId, selectStore } =
		useStoreSelection();

	if (isLoading) {
		return <Skeleton className="h-8 w-40" />;
	}

	const hasMultipleStores = stores.length > 1;
	const selectedStore = stores.find((s) => s.id === selectedStoreId);

	// No stores - show placeholder
	if (stores.length === 0) {
		return (
			<div className="flex h-8 items-center gap-2 rounded-md border border-muted-foreground/30 border-dashed bg-muted/30 px-3 text-muted-foreground text-sm">
				<Store className="h-4 w-4" />
				<span>{t("noStores", "No stores")}</span>
			</div>
		);
	}

	// Single store - read-only display
	if (!hasMultipleStores && selectedStore) {
		return (
			<div className="flex h-8 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm">
				<Store className="h-4 w-4 text-muted-foreground" />
				<span className="max-w-80 truncate font-medium">
					{selectedStore.name}
				</span>
			</div>
		);
	}

	// Multiple stores - selector
	return (
		<Select value={selectedStoreId} onValueChange={selectStore}>
			<SelectTrigger className="h-8 w-auto min-w-48 max-w-96 gap-2">
				<div className="flex flex-1 items-center gap-2 overflow-hidden">
					<Store className="h-4 w-4 shrink-0 text-muted-foreground" />
					<SelectValue placeholder={t("selectStore", "Select store")} />
				</div>
			</SelectTrigger>
			<SelectContent>
				{stores.map((store) => (
					<SelectItem key={store.id} value={store.id}>
						{store.name}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}

export function ConsoleHeader() {
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
			// Clear all queries on logout
			queryClient.clear();
			toast.success(tToasts("success.loggedOut"));
		},
		onError: () => {
			toast.error(tToasts("error.logout"));
		},
	});

	return (
		<header className="flex h-12 items-center justify-between border-b-0 bg-card/50 px-4">
			{/* Left: Store selector */}
			<StoreSelector />

			{/* Right: Help + User menu */}
			<div className="flex items-center gap-1">
				<Button variant="ghost" size="icon" className="h-8 w-8" asChild>
					<Link to="/help">
						<HelpCircle className="h-4 w-4" />
						<span className="sr-only">{t("help", "Help")}</span>
					</Link>
				</Button>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
							<div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
								<User className="h-3.5 w-3.5 text-muted-foreground" />
							</div>
							<ChevronDown className="h-3 w-3 text-muted-foreground" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-48">
						<DropdownMenuItem asChild>
							<Link to="/settings" search={{ tab: "business" }}>
								<User className="me-2 h-4 w-4" />
								{t("profile", "Profile")}
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="text-destructive focus:text-destructive"
							onClick={() => logout.mutate()}
						>
							<LogOut className="me-2 h-4 w-4" />
							{t("logout", "Logout")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
}
