import { queryOptions } from "@tanstack/react-query";
import { getAllMerchants } from "./server/fake-auth.functions";

export const authQueries = {
	allMerchants: queryOptions({
		queryKey: ["merchants", "all"],
		queryFn: () => getAllMerchants(),
	}),
};
