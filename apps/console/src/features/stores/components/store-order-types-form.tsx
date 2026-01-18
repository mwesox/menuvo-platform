import type { AppRouter } from "@menuvo/api/trpc";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Field,
	FieldLabel,
	Switch,
} from "@menuvo/ui";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { inferRouterInputs } from "@trpc/server";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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

const ORDER_TYPE_KEYS: OrderTypeKey[] = ["dine_in", "takeaway", "delivery"];

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

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			className="space-y-6"
		>
			<Card>
				<CardHeader>
					<CardTitle>{t("orderTypes.title")}</CardTitle>
					<CardDescription>{t("orderTypes.description")}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{ORDER_TYPE_KEYS.map((key) => (
						<form.Field key={key} name={key}>
							{(field) => (
								<Field orientation="horizontal" className="justify-between">
									<FieldLabel htmlFor={`order-type-${key}`} className="flex-1">
										{getOrderTypeLabel(key)}
									</FieldLabel>
									<Switch
										id={`order-type-${key}`}
										checked={field.state.value}
										onCheckedChange={field.handleChange}
									/>
								</Field>
							)}
						</form.Field>
					))}
				</CardContent>
			</Card>

			<form.Subscribe selector={(state) => state.isSubmitting}>
				{(isSubmitting) => (
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting
							? tCommon("states.saving")
							: tCommon("buttons.saveChanges")}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}
