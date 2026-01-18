import type { AppRouter } from "@menuvo/api/trpc";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutput = inferRouterOutputs<AppRouter>;

export type ServicePoint =
	RouterOutput["store"]["servicePoints"]["list"][number];

export type StoreSummary = Pick<
	NonNullable<RouterOutput["store"]["getWithDetails"]>,
	"id" | "slug"
>;
