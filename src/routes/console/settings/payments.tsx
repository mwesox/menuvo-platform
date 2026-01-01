import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { PaymentsPage } from "@/features/console/settings/components/payments";
import { paymentQueries } from "@/features/console/settings/queries";

const searchSchema = z.object({
	from: z.enum(["stripe"]).optional(),
	refresh: z.boolean().optional(),
});

// For now, hardcode merchantId=1 (in production, get from auth context)
const MERCHANT_ID = 1;

export const Route = createFileRoute("/console/settings/payments")({
	validateSearch: searchSchema,
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			paymentQueries.status(MERCHANT_ID),
		);
	},
	component: RouteComponent,
});

function RouteComponent() {
	return <PaymentsPage merchantId={MERCHANT_ID} />;
}
