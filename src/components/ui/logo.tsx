import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
	className?: string;
	height?: number;
}

export function Logo({ className, height = 32 }: LogoProps) {
	const { resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const logoSrc =
		mounted && resolvedTheme === "dark"
			? "/menuvo-logo-white.svg"
			: "/menuvo-logo.svg";

	return (
		<img
			src={logoSrc}
			alt="Menuvo"
			style={{ height }}
			className={cn("w-auto", className)}
		/>
	);
}
