import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CategoryItemsPage } from "@/features/console/menu/components/category-items-page";
import { DisplayLanguageProvider } from "@/features/console/menu/contexts/display-language-context";
import { categoryQueries } from "@/features/console/menu/queries";
import { merchantQueries } from "@/features/console/settings/queries";

const MERCHANT_ID = 1;

const searchSchema = z.object({
	storeId: z.number(),
});

export const Route = createFileRoute("/console/menu/categories/$categoryId")({
	validateSearch: searchSchema,
	loader: async ({ context, params }) => {
		const categoryId = Number.parseInt(params.categoryId, 10);
		const [, merchant] = await Promise.all([
			context.queryClient.ensureQueryData(categoryQueries.detail(categoryId)),
			context.queryClient.ensureQueryData(merchantQueries.detail(MERCHANT_ID)),
		]);
		return {
			displayLanguage: merchant.supportedLanguages?.[0] ?? "de",
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { categoryId } = Route.useParams();
	const { storeId } = Route.useSearch();
	const { displayLanguage } = Route.useLoaderData();
	const categoryIdNum = Number.parseInt(categoryId, 10);

	return (
		<DisplayLanguageProvider language={displayLanguage}>
			<CategoryItemsPage categoryId={categoryIdNum} storeId={storeId} />
		</DisplayLanguageProvider>
	);
}
