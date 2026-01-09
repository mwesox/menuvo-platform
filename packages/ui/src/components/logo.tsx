import { cn } from "../lib/utils";

interface LogoProps {
	className?: string;
	height?: number;
}

export function Logo({ className, height = 32 }: LogoProps) {
	return (
		<img
			src="/menuvo-logo.svg"
			alt="Menuvo"
			style={{ height }}
			className={cn("w-auto", className)}
		/>
	);
}
