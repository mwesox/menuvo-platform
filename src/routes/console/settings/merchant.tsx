import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireMerchant } from "@/features/console/auth/server/merchant.functions";
import { MerchantSettingsPage } from "@/features/console/settings/components/merchant/merchant-settings-page";

const searchSchema = z.object({
	tab: z.enum(["general", "language"]).optional().default("general"),
});

export const Route = createFileRoute("/console/settings/merchant")({
	validateSearch: searchSchema,
	beforeLoad: async () => requireMerchant(),
	component: RouteComponent,
});

function RouteComponent() {
	const search = Route.useSearch();
	const { merchantId } = Route.useRouteContext();
	return <MerchantSettingsPage search={search} merchantId={merchantId} />;
}
