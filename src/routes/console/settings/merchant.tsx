import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ConsoleError } from "@/features/console/components/console-error";
import { MerchantSettingsPage } from "@/features/console/settings/components/merchant/merchant-settings-page";
import { MerchantSettingsPageSkeleton } from "@/features/console/settings/components/skeletons";

const searchSchema = z.object({
	tab: z.enum(["general", "language"]).optional().default("general"),
});

export const Route = createFileRoute("/console/settings/merchant")({
	validateSearch: searchSchema,
	component: RouteComponent,
	pendingComponent: MerchantSettingsPageSkeleton,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	const search = Route.useSearch();
	const { merchantId } = Route.useRouteContext();

	// merchantId is guaranteed by parent route redirect
	if (!merchantId) return null;

	return <MerchantSettingsPage search={search} merchantId={merchantId} />;
}
