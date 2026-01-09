/**
 * Auth queries and mutations using tRPC
 *
 * Note: Login/register are handled externally (e.g., OAuth, SSO).
 * This module only handles session queries and logout.
 */

import {
	queryOptions,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { trpc, useTRPC, useTRPCClient } from "@/lib/trpc";

export const authQueries = {
	session: trpc.auth.getSession.queryOptions(),
	me: trpc.auth.me.queryOptions(),
	merchant: trpc.auth.getMerchant.queryOptions(),
	merchantOrNull: trpc.auth.getMerchantOrNull.queryOptions(),
	/**
	 * Dev-only: List all merchants for dev login selector.
	 * TODO: This requires a tRPC procedure or dev-only API route.
	 * For now returns empty array.
	 */
	allMerchants: queryOptions({
		queryKey: ["auth", "allMerchants"],
		queryFn: async (): Promise<
			Array<{
				id: string;
				name: string;
				ownerName: string;
				email: string;
				stores: Array<{ name: string }>;
			}>
		> => {
			// TODO: Implement tRPC procedure for dev auth
			// This is only used in development for the merchant selector
			console.warn(
				"[DEV] allMerchants query not implemented - need tRPC procedure",
			);
			return [];
		},
	}),
};

export function useLogout() {
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
		...trpc.auth.logout.mutationOptions(),
		mutationFn: async () => {
			return trpcClient.auth.logout.mutate();
		},
		onSuccess: () => {
			// Clear all queries on logout
			queryClient.clear();
			toast.success(t("success.loggedOut"));
		},
		onError: () => {
			toast.error(t("error.logout"));
		},
	});
}
