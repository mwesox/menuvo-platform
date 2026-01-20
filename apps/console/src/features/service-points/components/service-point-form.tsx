import type { AppRouter } from "@menuvo/api/trpc";
import {
	Button,
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	Input,
	Textarea,
} from "@menuvo/ui";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { inferRouterInputs } from "@trpc/server";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useTRPC, useTRPCClient } from "@/lib/trpc";
import { servicePointFormSchema } from "../schemas";
import type { ServicePoint } from "../types.ts";
import { AttributesEditor } from "./attributes-editor.tsx";

interface ServicePointFormProps {
	storeId: string;
	servicePoint?: ServicePoint;
	onSuccess?: () => void;
	onCancel?: () => void;
}

function generateCode(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

export function ServicePointForm({
	storeId,
	servicePoint,
	onSuccess,
	onCancel,
}: ServicePointFormProps) {
	const { t } = useTranslation("servicePoints");
	const { t: tToasts } = useTranslation("toasts");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();
	const isEditing = !!servicePoint;

	type RouterInput = inferRouterInputs<AppRouter>;
	type CreateServicePointInput =
		RouterInput["store"]["servicePoints"]["create"];

	const createMutation = useMutation({
		mutationKey: trpc.store.servicePoints.create.mutationKey(),
		mutationFn: (input: Omit<CreateServicePointInput, "storeId">) =>
			trpcClient.store.servicePoints.create.mutate({ ...input, storeId }),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.store.servicePoints.list.queryKey({ storeId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.store.servicePoints.getZones.queryKey({ storeId }),
			});
			toast.success(tToasts("success.servicePointCreated"));
		},
		onError: () => {
			toast.error(tToasts("error.createServicePoint"));
		},
	});

	type UpdateServicePointInput =
		RouterInput["store"]["servicePoints"]["update"];

	const updateMutation = useMutation({
		mutationKey: trpc.store.servicePoints.update.mutationKey(),
		mutationFn: (input: UpdateServicePointInput) =>
			trpcClient.store.servicePoints.update.mutate(input),
		onSuccess: (updated) => {
			queryClient.invalidateQueries({
				queryKey: trpc.store.servicePoints.getById.queryKey({ id: updated.id }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.store.servicePoints.list.queryKey({ storeId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.store.servicePoints.getZones.queryKey({ storeId }),
			});
			toast.success(tToasts("success.servicePointUpdated"));
		},
		onError: () => {
			toast.error(tToasts("error.updateServicePoint"));
		},
	});

	// Get existing zones for suggestions
	const { data: existingZones = [] } = useQuery({
		...trpc.store.servicePoints.getZones.queryOptions({ storeId }),
	});

	const [autoGenerateCode, setAutoGenerateCode] = useState(!isEditing);

	const form = useForm({
		defaultValues: {
			name: servicePoint?.name ?? "",
			code: servicePoint?.code ?? "",
			zone: servicePoint?.zone ?? "",
			description: servicePoint?.description ?? "",
			attributes: (servicePoint?.attributes ?? {}) as Record<
				string,
				string | number | boolean
			>,
		},
		validators: {
			onSubmit: servicePointFormSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				if (isEditing) {
					await updateMutation.mutateAsync({
						id: servicePoint.id,
						...value,
						zone: value.zone || undefined,
						description: value.description || undefined,
						attributes:
							Object.keys(value.attributes).length > 0
								? value.attributes
								: undefined,
					});
				} else {
					await createMutation.mutateAsync({
						...value,
						zone: value.zone || undefined,
						description: value.description || undefined,
						attributes:
							Object.keys(value.attributes).length > 0
								? value.attributes
								: undefined,
					});
				}
				onSuccess?.();
			} catch {
				// Error already handled by mutation
			}
		},
	});

	// Auto-generate code from name when name field changes
	const handleNameChange = (name: string) => {
		if (autoGenerateCode) {
			form.setFieldValue("code", generateCode(name));
		}
	};

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			className="space-y-6"
		>
			<FieldGroup>
				<form.Field name="name">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>
									{t("labels.name")} *
								</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									placeholder={t("placeholders.name")}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => {
										field.handleChange(e.target.value);
										handleNameChange(e.target.value);
									}}
									aria-invalid={isInvalid}
								/>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>

				<form.Field name="code">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>
									{t("labels.urlCode")} *
									{autoGenerateCode && (
										<span className="ms-2 text-muted-foreground text-xs">
											{t("labels.autoGenerated")}
										</span>
									)}
								</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									placeholder={t("placeholders.code")}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => {
										field.handleChange(e.target.value);
										if (autoGenerateCode) setAutoGenerateCode(false);
									}}
									aria-invalid={isInvalid}
								/>
								<p className="text-muted-foreground text-xs">
									{t("hints.urlCode")}
								</p>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>

				<form.Field name="zone">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>{t("labels.zone")}</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									placeholder={t("placeholders.zone")}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									list="zone-suggestions"
									aria-invalid={isInvalid}
								/>
								{existingZones && existingZones.length > 0 && (
									<datalist id="zone-suggestions">
										{existingZones.map((zone) => (
											<option key={zone} value={zone} />
										))}
									</datalist>
								)}
								<p className="text-muted-foreground text-xs">
									{t("hints.zone")}
								</p>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
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
								<FieldLabel htmlFor={field.name}>
									{t("labels.description")}
								</FieldLabel>
								<Textarea
									id={field.name}
									name={field.name}
									placeholder={t("placeholders.description")}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									rows={2}
									aria-invalid={isInvalid}
								/>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>

				<form.Field name="attributes">
					{(field) => (
						<Field>
							<FieldLabel>{t("labels.attributes")}</FieldLabel>
							<AttributesEditor
								value={field.state.value}
								onChange={field.handleChange}
							/>
						</Field>
					)}
				</form.Field>
			</FieldGroup>

			<form.Subscribe selector={(state) => state.isSubmitting}>
				{(isSubmitting) => (
					<div className="flex justify-end gap-2">
						{onCancel && (
							<Button type="button" variant="outline" onClick={onCancel}>
								{t("buttons.cancel")}
							</Button>
						)}
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting
								? isEditing
									? t("buttons.updating")
									: t("buttons.creating")
								: isEditing
									? t("buttons.update")
									: t("buttons.create")}
						</Button>
					</div>
				)}
			</form.Subscribe>
		</form>
	);
}
