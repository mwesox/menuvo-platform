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
import { trpcClient } from "@/lib/trpc";

export const authQueries = {
	session: queryOptions({
		queryKey: ["auth", "session"],
		queryFn: async () => {
			return trpcClient.auth.getSession.query();
		},
	}),
	me: queryOptions({
		queryKey: ["auth", "me"],
		queryFn: async () => {
			return trpcClient.auth.me.query();
		},
	}),
	merchant: queryOptions({
		queryKey: ["auth", "merchant"],
		queryFn: async () => {
			return trpcClient.auth.getMerchant.query();
		},
	}),
	merchantOrNull: queryOptions({
		queryKey: ["auth", "merchantOrNull"],
		queryFn: async () => {
			return trpcClient.auth.getMerchantOrNull.query();
		},
	}),
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
	const queryClient = useQueryClient();
	const { t } = useTranslation("toasts");

	return useMutation({
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
