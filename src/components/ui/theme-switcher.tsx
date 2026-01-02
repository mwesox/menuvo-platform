import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const THEMES = ["light", "dark", "system"] as const;
type Theme = (typeof THEMES)[number];

const themeConfig: Record<Theme, { label: string; icon: typeof Sun }> = {
	light: { label: "Light", icon: Sun },
	dark: { label: "Dark", icon: Moon },
	system: { label: "System", icon: Monitor },
};

export function ThemeSwitcher() {
	const { theme, setTheme, resolvedTheme } = useTheme();
	const currentTheme = (theme || "system") as Theme;

	const CurrentIcon = resolvedTheme === "dark" ? Moon : Sun;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon">
					<CurrentIcon className="h-4 w-4" />
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{THEMES.map((t) => {
					const { label, icon: Icon } = themeConfig[t];
					return (
						<DropdownMenuItem
							key={t}
							onClick={() => setTheme(t)}
							className={currentTheme === t ? "bg-accent" : ""}
						>
							<Icon className="mr-2 h-4 w-4" />
							{label}
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
