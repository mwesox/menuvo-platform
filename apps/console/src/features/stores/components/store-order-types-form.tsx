import { HStack, Icon, Switch, Text, VStack } from "@chakra-ui/react";
import type { AppRouter } from "@menuvo/api/trpc";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { inferRouterInputs } from "@trpc/server";
import { ShoppingBag, Truck, UtensilsCrossed } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { SettingsFormFooter } from "@/components/layout/settings-form-footer";
import { FormSection } from "@/components/ui/form-section";
import {
	SettingsRowGroup,
	SettingsRowItem,
} from "@/components/ui/settings-row";
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
	icon: React.ComponentType<{ style?: React.CSSProperties }>;
}

const ORDER_TYPE_CONFIG: OrderTypeConfig[] = [
	{ key: "dine_in", icon: UtensilsCrossed },
	{ key: "takeaway", icon: ShoppingBag },
	{ key: "delivery", icon: Truck },
];

export function StoreOrderTypesForm({ storeId }: StoreOrderTypesFormProps) {
	const { t } = useTranslation("stores");
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

	// Reset form when settings change
	useEffect(() => {
		form.reset(defaultValues);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [defaultValues]);

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
		>
			<VStack gap="6" align="stretch" w="full">
				<FormSection
					title={t("orderTypes.title")}
					description={t("orderTypes.description")}
					variant="plain"
				>
					<SettingsRowGroup>
						{ORDER_TYPE_CONFIG.map(({ key, icon: IconComponent }) => (
							<form.Field key={key} name={key}>
								{(field) => (
									<SettingsRowItem
										label={
											<HStack gap="2">
												<Icon
													fontSize="md"
													color={
														field.state.value
															? "colorPalette.primary"
															: "fg.muted"
													}
												>
													<IconComponent />
												</Icon>
												<Text fontWeight="medium" textStyle="sm">
													{getOrderTypeLabel(key)}
												</Text>
											</HStack>
										}
										description={getOrderTypeDescription(key)}
										action={
											<Switch.Root
												id={`order-type-${key}`}
												aria-label={getOrderTypeLabel(key)}
												checked={field.state.value}
												onCheckedChange={(e) => field.handleChange(e.checked)}
												colorPalette="red"
											>
												<Switch.HiddenInput />
												<Switch.Control />
											</Switch.Root>
										}
									/>
								)}
							</form.Field>
						))}
					</SettingsRowGroup>
				</FormSection>

				<form.Subscribe selector={(state) => state.isSubmitting}>
					{(isSubmitting) => <SettingsFormFooter isSubmitting={isSubmitting} />}
				</form.Subscribe>
			</VStack>
		</form>
	);
}
