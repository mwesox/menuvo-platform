import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/live")({
	server: {
		handlers: {
			GET: () =>
				Response.json(
					{
						status: "ok",
						timestamp: new Date().toISOString(),
					},
					{
						headers: {
							"cache-control": "no-store",
						},
					},
				),
		},
	},
});
