import { createFileRoute } from "@tanstack/react-router";
import { StoreMenuPage, StoreMenuPageSkeleton } from "@/features/shop/menu";

export const Route = createFileRoute("/shop/$slug/")({
	component: StoreMenuPage,
	pendingComponent: StoreMenuPageSkeleton,
});
