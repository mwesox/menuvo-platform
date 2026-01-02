import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireMerchant } from "@/features/console/auth/server/merchant.functions";
import { PaymentsPage } from "@/features/console/settings/components/payments";

const searchSchema = z.object({
	from: z.enum(["stripe"]).optional(),
	refresh: z.boolean().optional(),
});

export const Route = createFileRoute("/console/settings/payments")({
	validateSearch: searchSchema,
	beforeLoad: async () => requireMerchant(),
	component: RouteComponent,
});

function RouteComponent() {
	const { merchantId } = Route.useRouteContext();
	return <PaymentsPage merchantId={merchantId} />;
}
