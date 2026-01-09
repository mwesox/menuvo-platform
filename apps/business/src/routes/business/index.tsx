import { createFileRoute } from "@tanstack/react-router";
import { BusinessLandingPage } from "../../features/business";

export const Route = createFileRoute("/business/")({
	component: BusinessLandingPage,
});
