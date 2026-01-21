import { Image } from "@chakra-ui/react";

interface LogoProps {
	height?: number;
	className?: string;
}

export function Logo({ height = 32, className }: LogoProps) {
	return (
		<Image
			src="/menuvo-logo.svg"
			alt="Menuvo"
			h={`${height}px`}
			w="auto"
			className={className}
		/>
	);
}
