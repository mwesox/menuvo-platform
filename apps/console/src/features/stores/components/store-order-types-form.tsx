import type { AppRouter } from "@menuvo/api/trpc";
import { Button, Switch } from "@menuvo/ui";
import { cn } from "@menuvo/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { inferRouterInputs } from "@trpc/server";
import { ShoppingBag, Truck, UtensilsCrossed } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ContentSection } from "@/components/ui/content-section";
import { useTRPC, useTRPCClient } from "@/lib/trpc";

interface StoreOrderTypesFormProps {
	storeId: string;
}

type OrderTypeKey = "dine_in" | "takeaway" | "delivery";

interface OrderTypeFormValue {
	dine_in: boolean;
	takeaway: boolean;
	delivery: boolean;
}

interface OrderTypeConfig {
	key: OrderTypeKey;
	icon: React.ComponentType<{ className?: string }>;
}

const ORDER_TYPE_CONFIG: OrderTypeConfig[] = [
	{ key: "dine_in", icon: UtensilsCrossed },
	{ key: "takeaway", icon: ShoppingBag },
	{ key: "delivery", icon: Truck },
];

export function StoreOrderTypesForm({ storeId }: StoreOrderTypesFormProps) {
	const { t } = useTranslation("stores");
	const { t: tCommon } = useTranslation("common");
	const { t: tToasts } = useTranslation("toasts");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();

	const { data: settings } = useQuery({
		...trpc.store.settings.get.queryOptions({ storeId }),
	});

	type RouterInput = inferRouterInputs<AppRouter>;
	type SaveOrderTypesInput = RouterInput["store"]["settings"]["saveOrderTypes"];

	const saveMutation = useMutation({
		mutationKey: trpc.store.settings.saveOrderTypes.mutationKey(),
		mutationFn: async (input: SaveOrderTypesInput) =>
			trpcClient.store.settings.saveOrderTypes.mutate(input),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: trpc.store.settings.get.queryKey({
					storeId: variables.storeId,
				}),
			});
			toast.success(tToasts("success.orderTypesUpdated"));
		},
		onError: () => {
			toast.error(tToasts("error.updateOrderTypes"));
		},
	});

	const defaultValues = useMemo((): OrderTypeFormValue => {
		if (!settings) {
			return { dine_in: true, takeaway: true, delivery: true };
		}
		return {
			dine_in: settings.orderTypes.dine_in.enabled,
			takeaway: settings.orderTypes.takeaway.enabled,
			delivery: settings.orderTypes.delivery.enabled,
		};
	}, [settings]);

	const form = useForm({
		defaultValues,
		onSubmit: async ({ value }) => {
			// Validate at least one is enabled
			if (!value.dine_in && !value.takeaway && !value.delivery) {
				toast.error(t("validation.atLeastOneOrderType"));
				return;
			}

			await saveMutation.mutateAsync({
				storeId,
				orderTypes: {
					dine_in: {
						enabled: value.dine_in,
						displayOrder: 0,
					},
					takeaway: {
						enabled: value.takeaway,
						displayOrder: 1,
					},
					delivery: {
						enabled: value.delivery,
						displayOrder: 2,
					},
				},
			});
		},
	});

	const getOrderTypeLabel = (key: OrderTypeKey): string => {
		const labels: Record<OrderTypeKey, string> = {
			dine_in: t("orderTypes.dine_in"),
			takeaway: t("orderTypes.takeaway"),
			delivery: t("orderTypes.delivery"),
		};
		return labels[key];
	};

	const getOrderTypeDescription = (key: OrderTypeKey): string => {
		const descriptions: Record<OrderTypeKey, string> = {
			dine_in: t("orderTypes.dine_inDescription"),
			takeaway: t("orderTypes.takeawayDescription"),
			delivery: t("orderTypes.deliveryDescription"),
		};
		return descriptions[key];
	};

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			className="space-y-8"
		>
			<ContentSection
				title={t("orderTypes.title")}
				description={t("orderTypes.description")}
			>
				<div className="space-y-3">
					{ORDER_TYPE_CONFIG.map(({ key, icon: Icon }) => (
						<form.Field key={key} name={key}>
							{(field) => (
								<label
									htmlFor={`order-type-${key}`}
									className={cn(
										"flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors",
										field.state.value
											? "border-primary/50 bg-primary/5"
											: "border-border bg-background hover:bg-muted/50",
									)}
								>
									<div
										className={cn(
											"flex size-10 shrink-0 items-center justify-center rounded-lg",
											field.state.value
												? "bg-primary/10 text-primary"
												: "bg-muted text-muted-foreground",
										)}
									>
										<Icon className="size-5" />
									</div>
									<div className="flex-1">
										<div className="font-medium">{getOrderTypeLabel(key)}</div>
										<div className="text-muted-foreground text-sm">
											{getOrderTypeDescription(key)}
										</div>
									</div>
									<Switch
										id={`order-type-${key}`}
										checked={field.state.value}
										onCheckedChange={field.handleChange}
									/>
								</label>
							)}
						</form.Field>
					))}
				</div>
			</ContentSection>

			<div className="flex justify-end border-t pt-6">
				<form.Subscribe selector={(state) => state.isSubmitting}>
					{(isSubmitting) => (
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting
								? tCommon("states.saving")
								: tCommon("buttons.saveChanges")}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</form>
	);
}
