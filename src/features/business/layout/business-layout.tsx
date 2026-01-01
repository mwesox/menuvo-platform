import type { ReactNode } from "react";

interface BusinessLayoutProps {
	children: ReactNode;
}

export function BusinessLayout({ children }: BusinessLayoutProps) {
	return <div className="min-h-screen flex flex-col">{children}</div>;
}
