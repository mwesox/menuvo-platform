import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { useTRPC } from "@/lib/trpc";
import { AiRecommendationsForm } from "./ai-recommendations-form";

interface AiRecommendationsPageProps {
	storeId: string;
}

export function AiRecommendationsPage({ storeId }: AiRecommendationsPageProps) {
	const { t } = useTranslation("settings");
	const trpc = useTRPC();

	// Pre-fetch store data for display
	const { data: store } = useQuery({
		...trpc.store.getById.queryOptions({ storeId }),
	});

	return (
		<div className="space-y-6">
			<PageActionBar
				breadcrumbs={[
					{ label: t("hub.pageTitle"), href: "/settings" },
					{ label: t("hub.aiRecommendations.title") },
				]}
			/>

			{store && (
				<p className="text-muted-foreground text-sm">
					{t("aiRecommendations.storeContext", { storeName: store.name })}
				</p>
			)}

			<AiRecommendationsForm storeId={storeId} />
		</div>
	);
}
