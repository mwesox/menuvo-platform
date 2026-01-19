import type { AppRouter } from "@menuvo/api/trpc";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	Input,
	LoadingButton,
	Textarea,
} from "@menuvo/ui";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
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
		defaultValues: vatGroupFormDefaults,
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
				to: "/menu/vat",
				search: { storeId },
			});
		},
	});

	// Populate form when editing
	useEffect(() => {
		if (vatGroup) {
			form.setFieldValue("code", vatGroup.code);
			form.setFieldValue("name", vatGroup.name);
			form.setFieldValue("rate", basisPointsToPercentage(vatGroup.rate));
			form.setFieldValue("description", vatGroup.description ?? "");
		}
	}, [vatGroup]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{isEditing
						? t("vat.titles.editVatGroup")
						: t("vat.titles.addVatGroup")}
				</CardTitle>
				<CardDescription>
					{isEditing
						? t("vat.dialogs.updateVatGroupDescription")
						: t("vat.dialogs.createVatGroupDescription")}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						form.handleSubmit();
					}}
				>
					<FieldGroup>
						<form.Field name="code">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor="vat-code">
											{t("vat.labels.code")} *
										</FieldLabel>
										<Input
											id="vat-code"
											name={field.name}
											placeholder={t("vat.placeholders.code")}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) =>
												field.handleChange(e.target.value.toLowerCase())
											}
											aria-invalid={isInvalid}
											disabled={isEditing}
										/>
										<FieldDescription>{t("vat.hints.code")}</FieldDescription>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>

						<form.Field name="name">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor="vat-name">
											{tForms("fields.name")} *
										</FieldLabel>
										<Input
											id="vat-name"
											name={field.name}
											placeholder={t("vat.placeholders.name")}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={isInvalid}
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>

						<form.Field name="rate">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor="vat-rate">
											{t("vat.labels.rate")} *
										</FieldLabel>
										<div className="relative">
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
												aria-invalid={isInvalid}
												className="pr-8"
											/>
											<span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground">
												%
											</span>
										</div>
										<FieldDescription>{t("vat.hints.rate")}</FieldDescription>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>

						<form.Field name="description">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor="vat-description">
											{tForms("fields.description")}
										</FieldLabel>
										<Textarea
											id="vat-description"
											name={field.name}
											placeholder={t("vat.placeholders.description")}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											rows={3}
											aria-invalid={isInvalid}
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>
					</FieldGroup>

					<div className="mt-6 flex justify-end gap-3">
						<Button type="button" variant="outline" asChild>
							<Link to="/menu/vat" search={{ storeId }}>
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
								<LoadingButton
									type="submit"
									disabled={!canSubmit}
									isLoading={isSubmitting}
									loadingText={
										isEditing
											? tCommon("states.saving")
											: tCommon("states.creating")
									}
								>
									{isEditing
										? tCommon("buttons.saveChanges")
										: t("vat.buttons.createVatGroup")}
								</LoadingButton>
							)}
						</form.Subscribe>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
