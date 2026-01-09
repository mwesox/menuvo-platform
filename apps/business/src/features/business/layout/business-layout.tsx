import type { ReactNode } from "react";

interface BusinessLayoutProps {
	children: ReactNode;
}

export function BusinessLayout({ children }: BusinessLayoutProps) {
	return <div className="flex min-h-screen flex-col">{children}</div>;
}
