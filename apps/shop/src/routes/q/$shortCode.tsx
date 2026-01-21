import { Box, Flex, Heading, Link, Text } from "@chakra-ui/react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { trpcClient } from "../../lib/trpc";

export const Route = createFileRoute("/q/$shortCode")({
	loader: async ({ params }) => {
		const result = await trpcClient.store.resolveQRCode.query({
			shortCode: params.shortCode,
		});

		// If QR code resolves to an active store, redirect to the store page
		if (result.storeSlug) {
			throw redirect({
				to: "/$slug",
				params: { slug: result.storeSlug },
				search: result.servicePointCode
					? { sp: result.servicePointCode }
					: undefined,
				statusCode: 302,
			});
		}

		// Return status for error display
		return {
			status: result.status as
				| "not_found"
				| "store_inactive"
				| "service_point_inactive",
		};
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
		<Flex minH="100vh" align="center" justify="center" bg="bg" p="4">
			<Box maxW="md" textAlign="center">
				<Heading size="xl" fontWeight="semibold" color="fg">
					{message.title}
				</Heading>
				<Text mt="2" color="fg.muted">
					{message.description}
				</Text>
				<Text mt="6" color="fg.muted" fontSize="sm">
					Need help?{" "}
					<Link
						href="mailto:support@menuvo.app"
						color="colorPalette.solid"
						textDecoration="underline"
						_hover={{ textDecoration: "none" }}
					>
						Contact support
					</Link>
				</Text>
			</Box>
		</Flex>
	);
}
