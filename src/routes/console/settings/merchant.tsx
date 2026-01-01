import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { MerchantSettingsPage } from "@/features/console/settings/components/merchant/merchant-settings-page";
import { merchantQueries } from "@/features/console/settings/queries";

const searchSchema = z.object({
	tab: z.enum(["general", "language"]).optional().default("general"),
});

// For now, hardcode merchantId=1 (in production, get from auth context)
const MERCHANT_ID = 1;

export const Route = createFileRoute("/console/settings/merchant")({
	validateSearch: searchSchema,
	loader: async ({ context }) => {
		await context.queryClient.ensureQueryData(
			merchantQueries.detail(MERCHANT_ID),
		);
	},
	component: RouteComponent,
});

function RouteComponent() {
	const search = Route.useSearch();
	return <MerchantSettingsPage search={search} merchantId={MERCHANT_ID} />;
}
