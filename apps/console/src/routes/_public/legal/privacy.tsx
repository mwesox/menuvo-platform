import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "@/features/legal/components/privacy-page";

export const Route = createFileRoute("/_public/legal/privacy")({
	component: PrivacyPage,
});
