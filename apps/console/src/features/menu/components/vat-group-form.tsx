import {
	Box,
	Button,
	Card,
	HStack,
	Input,
	Textarea,
	VStack,
} from "@chakra-ui/react";
import type { AppRouter } from "@menuvo/api/trpc";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { FormField } from "@/components/ui/form-field";
import { useTRPC, useTRPCClient } from "@/lib/trpc";
import {
	basisPointsToPercentage,
	percentageToBasisPoints,
	vatGroupFormDefaults,
	vatGroupFormSchema,
} from "../vat.schemas";

type RouterOutput = inferRouterOutputs<AppRouter>;
type VatGroup = RouterOutput["menu"]["vat"]["getById"];

interface VatGroupFormProps {
	storeId: string;
	vatGroup?: VatGroup;
}

export function VatGroupForm({ storeId, vatGroup }: VatGroupFormProps) {
	const { t } = useTranslation("menu");
	const { t: tCommon } = useTranslation("common");
	const { t: tForms } = useTranslation("forms");
	const { t: tToasts } = useTranslation("toasts");
	const navigate = useNavigate();

	const isEditing = !!vatGroup;

	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();

	type RouterInput = inferRouterInputs<AppRouter>;
	type CreateVatGroupInput = RouterInput["menu"]["vat"]["create"];

	const createMutation = useMutation({
		mutationKey: trpc.menu.vat.create.mutationKey(),
		mutationFn: async (input: CreateVatGroupInput) =>
			trpcClient.menu.vat.create.mutate(input),
		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: trpc.menu.vat.list.queryKey(),
			});
			toast.success(tToasts("success.vatGroupCreated"));
		},
		onError: (error) => {
			toast.error(error.message || tToasts("error.createVatGroup"));
		},
	});

	type UpdateVatGroupInput = RouterInput["menu"]["vat"]["update"];

	const updateMutation = useMutation({
		mutationKey: trpc.menu.vat.update.mutationKey(),
		mutationFn: async (input: UpdateVatGroupInput) =>
			trpcClient.menu.vat.update.mutate(input),
		onSuccess: async (_, variables) => {
			await queryClient.invalidateQueries({
				queryKey: trpc.menu.vat.list.queryKey(),
			});
			await queryClient.invalidateQueries({
				queryKey: trpc.menu.vat.getById.queryKey({ id: variables.id }),
			});
			toast.success(tToasts("success.vatGroupUpdated"));
		},
		onError: (error) => {
			toast.error(error.message || tToasts("error.updateVatGroup"));
		},
	});

	const form = useForm({
		defaultValues: vatGroup
			? {
					code: vatGroup.code,
					name: vatGroup.name,
					rate: basisPointsToPercentage(vatGroup.rate),
					description: vatGroup.description ?? "",
				}
			: vatGroupFormDefaults,
		validators: {
			onSubmit: vatGroupFormSchema,
		},
		onSubmit: async ({ value }) => {
			const rateInBasisPoints = percentageToBasisPoints(value.rate);

			if (isEditing && vatGroup) {
				await updateMutation.mutateAsync({
					id: vatGroup.id,
					name: value.name,
					rate: rateInBasisPoints,
					description: value.description || undefined,
				});
			} else {
				await createMutation.mutateAsync({
					code: value.code.toLowerCase(),
					name: value.name,
					rate: rateInBasisPoints,
					description: value.description || undefined,
				});
			}

			navigate({
				to: "/stores/$storeId/menu/vat",
				params: { storeId },
			});
		},
	});

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>
					{isEditing
						? t("vat.titles.editVatGroup")
						: t("vat.titles.addVatGroup")}
				</Card.Title>
				<Card.Description>
					{isEditing
						? t("vat.dialogs.updateVatGroupDescription")
						: t("vat.dialogs.createVatGroupDescription")}
				</Card.Description>
			</Card.Header>
			<Card.Body>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
				>
					<VStack gap="6" align="stretch">
						<form.Field name="code">
							{(field) => (
								<FormField
									field={field}
									label={`${t("vat.labels.code")} *`}
									description={t("vat.hints.code")}
									required
								>
									<Input
										id="vat-code"
										name={field.name}
										placeholder={t("vat.placeholders.code")}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) =>
											field.handleChange(e.target.value.toLowerCase())
										}
										disabled={isEditing}
									/>
								</FormField>
							)}
						</form.Field>

						<form.Field name="name">
							{(field) => (
								<FormField
									field={field}
									label={`${tForms("fields.name")} *`}
									required
								>
									<Input
										id="vat-name"
										name={field.name}
										placeholder={t("vat.placeholders.name")}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
								</FormField>
							)}
						</form.Field>

						<form.Field name="rate">
							{(field) => (
								<FormField
									field={field}
									label={`${t("vat.labels.rate")} *`}
									description={t("vat.hints.rate")}
									required
								>
									<Box position="relative">
										<Input
											id="vat-rate"
											name={field.name}
											type="number"
											step="0.01"
											min="0"
											max="100"
											placeholder={t("vat.placeholders.rate")}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											pr="8"
										/>
										<Box
											position="absolute"
											top="50%"
											right="3"
											transform="translateY(-50%)"
											pointerEvents="none"
											color="fg.muted"
										>
											%
										</Box>
									</Box>
								</FormField>
							)}
						</form.Field>

						<form.Field name="description">
							{(field) => (
								<FormField field={field} label={tForms("fields.description")}>
									<Textarea
										id="vat-description"
										name={field.name}
										placeholder={t("vat.placeholders.description")}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										rows={3}
									/>
								</FormField>
							)}
						</form.Field>
					</VStack>

					<HStack mt="6" justify="flex-end" gap="3">
						<Button type="button" variant="outline" asChild>
							<Link to="/stores/$storeId/menu/vat" params={{ storeId }}>
								{tCommon("buttons.cancel")}
							</Link>
						</Button>
						<form.Subscribe
							selector={(state) => ({
								isSubmitting: state.isSubmitting,
								canSubmit: state.canSubmit,
							})}
						>
							{({ isSubmitting, canSubmit }) => (
								<Button
									type="submit"
									disabled={!canSubmit}
									loading={isSubmitting}
									loadingText={
										isEditing
											? tCommon("states.saving")
											: tCommon("states.creating")
									}
								>
									{isEditing
										? tCommon("buttons.saveChanges")
										: t("vat.buttons.createVatGroup")}
								</Button>
							)}
						</form.Subscribe>
					</HStack>
				</form>
			</Card.Body>
		</Card.Root>
	);
}
