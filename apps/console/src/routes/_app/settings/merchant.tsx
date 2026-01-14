import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod/v4";
import { ConsoleError } from "@/features/components/console-error";
import { MerchantSettingsPage } from "@/features/settings/components/merchant/merchant-settings-page";
import { MerchantSettingsPageSkeleton } from "@/features/settings/components/skeletons";

const searchSchema = z.object({
	tab: z.enum(["general", "language"]).optional().default("general"),
});

export const Route = createFileRoute("/_app/settings/merchant")({
	validateSearch: searchSchema,
	component: RouteComponent,
	pendingComponent: MerchantSettingsPageSkeleton,
	errorComponent: ConsoleError,
});

function RouteComponent() {
	const search = Route.useSearch();

	return <MerchantSettingsPage search={search} />;
}
