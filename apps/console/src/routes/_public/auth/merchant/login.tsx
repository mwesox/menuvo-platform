import { createFileRoute } from "@tanstack/react-router";
import { MerchantLoginPage } from "@/features/auth/components/merchant-login-page";

export const Route = createFileRoute("/_public/auth/merchant/login")({
	component: MerchantLoginPage,
});
