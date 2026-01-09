import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPage } from "../../features/legal";

export const Route = createFileRoute("/legal/privacy")({
	component: PrivacyPage,
});
