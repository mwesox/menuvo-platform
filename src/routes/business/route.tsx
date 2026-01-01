import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BusinessFooter, BusinessHeader } from "@/features/business/components";
import businessCss from "@/styles/business-bundle.css?url";

export const Route = createFileRoute("/business")({
	head: () => ({
		links: [{ rel: "stylesheet", href: businessCss }],
		meta: [
			{ title: "Menuvo for Business - Digital Menu Solutions" },
			{
				name: "description",
				content:
					"Transform your restaurant with Menuvo's digital menu platform. QR code menus, online ordering, and more.",
			},
		],
	}),
	component: BusinessLayoutWrapper,
});

function BusinessLayoutWrapper() {
	return (
		<div className="flex min-h-screen flex-col bg-background">
			<BusinessHeader />
			<main className="flex-1">
				<Outlet />
			</main>
			<BusinessFooter />
		</div>
	);
}
