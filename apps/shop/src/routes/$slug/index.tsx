import { createFileRoute } from "@tanstack/react-router";
import { StoreMenuPage, StoreMenuPageSkeleton } from "../../features/menu";

export const Route = createFileRoute("/$slug/")({
	component: StoreMenuPage,
	pendingComponent: StoreMenuPageSkeleton,
});
