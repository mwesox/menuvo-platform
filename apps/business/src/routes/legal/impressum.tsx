import { createFileRoute } from "@tanstack/react-router";
import { ImpressumPage } from "../../features/legal";

export const Route = createFileRoute("/legal/impressum")({
	component: ImpressumPage,
});
