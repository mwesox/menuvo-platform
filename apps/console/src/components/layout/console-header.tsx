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
} from "@menuvo/ui";
import { Link } from "@tanstack/react-router";
import { ChevronDown, HelpCircle, LogOut, Store, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLogout } from "@/features/auth/queries";

interface ConsoleHeaderProps {
	stores: Array<{ id: string; name: string; isActive: boolean }>;
	storeId?: string;
	onStoreChange?: (storeId: string) => void;
}

export function ConsoleHeader({
	stores,
	storeId,
	onStoreChange,
}: ConsoleHeaderProps) {
	const { t } = useTranslation("navigation");
	const logout = useLogout();

	const hasMultipleStores = stores.length > 1;
	const selectedStore = stores.find((s) => s.id === storeId) ?? stores[0];

	return (
		<header className="flex h-12 items-center justify-between border-b-0 bg-card/50 px-4">
			{/* Left: Store selector */}
			<div className="flex items-center gap-2">
				{hasMultipleStores && onStoreChange ? (
					<Select value={storeId} onValueChange={(v) => onStoreChange(v)}>
						<SelectTrigger className="h-8 w-[200px] border-0 bg-transparent hover:bg-accent">
							<div className="flex items-center gap-2">
								<Store className="h-4 w-4 text-muted-foreground" />
								<SelectValue placeholder={t("selectStore", "Filiale wählen")} />
							</div>
						</SelectTrigger>
						<SelectContent>
							{stores.map((store) => (
								<SelectItem key={store.id} value={String(store.id)}>
									{store.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : selectedStore ? (
					<div className="flex items-center gap-2 px-2 text-sm">
						<Store className="h-4 w-4 text-muted-foreground" />
						<span className="font-medium">{selectedStore.name}</span>
					</div>
				) : null}
			</div>

			{/* Right: Help + User menu */}
			<div className="flex items-center gap-1">
				<Button variant="ghost" size="icon" className="h-8 w-8" asChild>
					<Link to="/help">
						<HelpCircle className="h-4 w-4" />
						<span className="sr-only">{t("help", "Hilfe")}</span>
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
							<Link to="/settings/merchant">
								<User className="me-2 h-4 w-4" />
								{t("profile", "Profil")}
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="text-destructive focus:text-destructive"
							onClick={() => logout.mutate()}
						>
							<LogOut className="me-2 h-4 w-4" />
							{t("logout", "Abmelden")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
}
