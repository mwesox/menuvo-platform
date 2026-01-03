import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PaymentsPage } from "@/features/console/settings/components/payments";

const searchSchema = z.object({
	from: z.enum(["stripe"]).optional(),
	refresh: z.boolean().optional(),
});

export const Route = createFileRoute("/console/settings/payments")({
	validateSearch: searchSchema,
	component: RouteComponent,
});

function RouteComponent() {
	const { merchantId } = Route.useRouteContext();

	// merchantId is guaranteed by parent route redirect
	if (!merchantId) return null;

	return <PaymentsPage merchantId={merchantId} />;
}
