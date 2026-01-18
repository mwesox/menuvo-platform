import { createFileRoute } from "@tanstack/react-router";
import { ImpressumPage } from "@/features/legal/components/impressum-page";

export const Route = createFileRoute("/_public/legal/impressum")({
	component: ImpressumPage,
});
