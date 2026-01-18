import type { AppRouter } from "@menuvo/api/trpc";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutput = inferRouterOutputs<AppRouter>;

export type MenuData = RouterOutput["menu"]["shop"]["getMenu"];
export type MenuCategory = MenuData["categories"][number];
export type MenuItemLight = MenuCategory["items"][number];

export type MenuItemDetails = RouterOutput["menu"]["shop"]["getItemDetails"];
export type MenuItemOptionGroup = MenuItemDetails["optionGroups"][number];
export type MenuItemChoice = MenuItemOptionGroup["choices"][number];
export type OptionGroupType = MenuItemOptionGroup["type"];
