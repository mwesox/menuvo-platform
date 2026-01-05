import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ConsoleError } from "@/features/console/components/console-error";
import { PaymentsPage } from "@/features/console/settings/components/payments";
import { PaymentsPageSkeleton } from "@/features/console/settings/components/skeletons";
import { molliePaymentQueries } from "@/features/console/settings/queries";

// Stripe import - kept for future use
// import { paymentQueries } from "@/features/console/settings/queries";

const searchSchema = z.object({
	from: z.literal("mollie").optional(),
	refresh: z.boolean().optional(),
	error: z.string().optional(),
});

export const Route = createFileRoute("/console/settings/payments")({
	validateSearch: searchSchema,
	loader: async ({ context }) => {
		const merchantId = context.merchantId;
		if (!merchantId) return;

		// Prefetch Mollie status
		await context.queryClient.ensureQueryData(
			molliePaymentQueries.status(merchantId),
		);

		// Stripe prefetch - kept for future use
		// await context.queryClient.ensureQueryData(paymentQueries.status(merchantId));
	},
	component: RouteComponent,
	pendingComponent: PaymentsPageSkeleton,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	const { merchantId } = Route.useRouteContext();

	// merchantId is guaranteed by parent route redirect
	if (!merchantId) return null;

	return <PaymentsPage merchantId={merchantId} />;
}
