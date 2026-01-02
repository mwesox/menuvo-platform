import { createFileRoute } from "@tanstack/react-router";

import { checkHealth } from "@/lib/health";

export const Route = createFileRoute("/health")({
	server: {
		handlers: {
			GET: async () => {
				const { statusCode, payload } = await checkHealth();

				return Response.json(payload, {
					status: statusCode,
					headers: {
						"cache-control": "no-store",
					},
				});
			},
		},
	},
});
