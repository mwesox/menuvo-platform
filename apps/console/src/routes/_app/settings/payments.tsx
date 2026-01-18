import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod/v4";
import { ConsoleError } from "@/features/components/console-error";
import { PaymentsPage } from "@/features/settings/components/payments";
import { PaymentsPageSkeleton } from "@/features/settings/components/skeletons";

const searchSchema = z.object({
	from: z.literal("mollie").optional(),
	refresh: z.boolean().optional(),
	error: z.string().optional(),
});

export const Route = createFileRoute("/_app/settings/payments")({
	validateSearch: searchSchema,
	component: RouteComponent,
	pendingComponent: PaymentsPageSkeleton,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	const search = Route.useSearch();
	return <PaymentsPage search={search} />;
}
