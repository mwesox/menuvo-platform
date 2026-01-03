import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ConsoleError } from "@/features/console/components/console-error";
import { PaymentsPage } from "@/features/console/settings/components/payments";
import { PaymentsPageSkeleton } from "@/features/console/settings/components/skeletons";

const searchSchema = z.object({
	from: z.enum(["stripe"]).optional(),
	refresh: z.boolean().optional(),
});

export const Route = createFileRoute("/console/settings/payments")({
	validateSearch: searchSchema,
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
