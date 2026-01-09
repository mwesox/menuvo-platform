import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/legal/cookies")({
	beforeLoad: () => {
		throw redirect({ to: "/legal/privacy" });
	},
});
