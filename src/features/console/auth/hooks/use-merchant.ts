import { useSuspenseQuery } from "@tanstack/react-query";
import { getMerchant } from "../server/merchant.functions";

/**
 * Hook to get the current merchant in components.
 * Uses the same server function as route beforeLoad.
 */
export function useMerchant() {
	const { data: merchant } = useSuspenseQuery({
		queryKey: ["current-merchant"],
		queryFn: () => getMerchant(),
	});
	return merchant;
}
