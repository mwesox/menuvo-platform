import { Link } from "@tanstack/react-router";

export function DiscoveryHeader() {
	return (
		<header
			className="sticky top-0 z-50 border-b backdrop-blur-md"
			style={{
				backgroundColor: "oklch(0.988 0.003 90 / 0.95)",
				borderColor: "var(--border)",
			}}
		>
			<div className="flex h-14 items-center px-4">
				<Link to="/shop" className="shrink-0">
					<img src="/menuvo-logo-horizontal.svg" alt="Menuvo" className="h-8" />
				</Link>
			</div>
		</header>
	);
}
