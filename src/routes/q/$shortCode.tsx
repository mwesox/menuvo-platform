import { createFileRoute, redirect } from "@tanstack/react-router";
import { getServicePointByShortCode } from "@/features/console/service-points";

export const Route = createFileRoute("/q/$shortCode")({
	loader: async ({ params }) => {
		const result = await getServicePointByShortCode({
			data: { shortCode: params.shortCode },
		});

		if (result.status === "active") {
			throw redirect({
				to: "/$slug",
				params: { slug: result.storeSlug },
				search: { sp: result.servicePointCode },
				statusCode: 302,
			});
		}

		// Return status for error display
		return { status: result.status };
	},
	component: QRCodeError,
});

function QRCodeError() {
	const { status } = Route.useLoaderData();

	const messages = {
		not_found: {
			title: "QR Code Not Found",
			description:
				"This QR code is not recognized. Please check if the code is correct.",
		},
		store_inactive: {
			title: "Store Closed",
			description: "This store is currently not accepting orders.",
		},
		service_point_inactive: {
			title: "Service Point Unavailable",
			description: "This service point is currently not available.",
		},
	} as const;

	const message =
		messages[status as keyof typeof messages] ?? messages.not_found;

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<div className="max-w-md text-center">
				<h1 className="font-semibold text-2xl text-foreground">
					{message.title}
				</h1>
				<p className="mt-2 text-muted-foreground">{message.description}</p>
				<p className="mt-6 text-muted-foreground text-sm">
					Need help?{" "}
					<a
						href="mailto:support@menuvo.app"
						className="text-primary underline hover:no-underline"
					>
						Contact support
					</a>
				</p>
			</div>
		</div>
	);
}
