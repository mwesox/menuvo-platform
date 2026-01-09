import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ConsoleError } from "@/features/components/console-error";
import { PaymentsPage } from "@/features/settings/components/payments";
import { PaymentsPageSkeleton } from "@/features/settings/components/skeletons";

const searchSchema = z.object({
	from: z.literal("mollie").optional(),
	refresh: z.boolean().optional(),
	error: z.string().optional(),
});

export const Route = createFileRoute("/settings/payments")({
	validateSearch: searchSchema,
	component: RouteComponent,
	pendingComponent: PaymentsPageSkeleton,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	return <PaymentsPage />;
}
