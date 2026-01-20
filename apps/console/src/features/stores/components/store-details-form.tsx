import type { AppRouter } from "@menuvo/api/trpc";
import {
	Button,
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	Input,
	LoadingButton,
	PhoneInput,
} from "@menuvo/ui";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ContentSection } from "@/components/ui/content-section";
import { ImageUploadField } from "@/features/images/components/image-upload-field";
import { useTRPC, useTRPCClient } from "@/lib/trpc";
import { useSlugAvailability } from "../hooks/use-slug-availability";
import { storeFormSchema } from "../schemas";
import { ShopUrlDisplay } from "./shop-url-display";

type RouterOutput = inferRouterOutputs<AppRouter>;
type Store = NonNullable<RouterOutput["store"]["getWithDetails"]>;

/** Used only in create mode to show real-time slug availability */
function SlugAvailabilityDisplay({ name }: { name: string }) {
	const slugAvailability = useSlugAvailability({ name });

	return (
		<ShopUrlDisplay
			slug={slugAvailability.slug}
			isChecking={slugAvailability.isChecking}
			isAvailable={slugAvailability.isAvailable}
			nextAvailable={slugAvailability.nextAvailable}
		/>
	);
}

interface StoreDetailsFormProps {
	store?: Store;
	merchantId: string;
}

export function StoreDetailsForm({ store, merchantId }: StoreDetailsFormProps) {
	const navigate = useNavigate();
	const { t } = useTranslation("stores");
	const { t: tForms } = useTranslation("forms");
	const { t: tCommon } = useTranslation("common");
	const { t: tToasts } = useTranslation("toasts");
	const isEditing = !!store;

	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();

	type RouterInput = inferRouterInputs<AppRouter>;
	type CreateStoreInput = RouterInput["store"]["create"];

	const createStore = useMutation({
		mutationKey: trpc.store.create.mutationKey(),
		mutationFn: async (input: CreateStoreInput) =>
			trpcClient.store.create.mutate(input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.store.list.queryKey(),
			});
			toast.success(tToasts("success.storeCreated"));
			navigate({ to: "/stores" });
		},
		onError: () => {
			toast.error(tToasts("error.createStore"));
		},
	});

	type UpdateStoreInput = RouterInput["store"]["update"];

	const updateStore = useMutation({
		mutationKey: trpc.store.update.mutationKey(),
		mutationFn: async (input: UpdateStoreInput) =>
			trpcClient.store.update.mutate(input),
		onSuccess: (updatedStore) => {
			queryClient.invalidateQueries({
				queryKey: trpc.store.getById.queryKey({ storeId: updatedStore.id }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.store.getWithDetails.queryKey({
					storeId: updatedStore.id,
				}),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.store.list.queryKey(),
			});
			toast.success(tToasts("success.storeUpdated"));
		},
		onError: () => {
			toast.error(tToasts("error.updateStore"));
		},
	});

	// Normalize phone to E.164 format (remove spaces) for react-phone-number-input
	const normalizePhone = (phone: string | null | undefined): string => {
		if (!phone) return "";
		return phone.replace(/\s/g, "");
	};

	const form = useForm({
		defaultValues: {
			name: store?.name ?? "",
			street: store?.street ?? "",
			city: store?.city ?? "",
			postalCode: store?.postalCode ?? "",
			country: store?.country ?? "Germany",
			phone: normalizePhone(store?.phone),
			email: store?.email ?? "",
		},
		validators: {
			onSubmit: storeFormSchema,
		},
		onSubmit: async ({ value }) => {
			if (isEditing) {
				// Stay on page after update
				updateStore.mutate({ storeId: store.id, ...value });
			} else {
				createStore.mutate(value);
			}
		},
	});

	const handleLogoChange = useCallback(
		async (url: string | undefined) => {
			if (!store) return;
			try {
				await trpcClient.store.updateImage.mutate({
					storeId: store.id,
					imageUrl: url ?? null,
				});
				queryClient.invalidateQueries({
					queryKey: trpc.store.getWithDetails.queryKey({ storeId: store.id }),
				});
			} catch {
				toast.error(t("errors.updateLogoFailed"));
			}
		},
		[store, queryClient, trpc, trpcClient, t],
	);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			className="space-y-8"
		>
			{/* Store Details Section */}
			<ContentSection
				title={t("titles.storeDetails")}
				description={t("descriptions.storeDetails")}
			>
				<FieldGroup>
					<form.Field name="name">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>
										{tForms("fields.storeName")}
									</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										placeholder={tForms("placeholders.downtownLocation")}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										aria-invalid={isInvalid}
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>

					{/* Shop URL display - slug is permanent once created */}
					{isEditing ? (
						// Edit mode: show static URL (slug never changes)
						<ShopUrlDisplay slug={store.slug} />
					) : (
						// Create mode: show with availability checking
						<form.Subscribe selector={(state) => state.values.name}>
							{(name) =>
								name ? <SlugAvailabilityDisplay name={name} /> : null
							}
						</form.Subscribe>
					)}

					<form.Field name="street">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>
										{tForms("fields.streetAddress")}
									</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										placeholder={tForms("placeholders.mainStreet")}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										aria-invalid={isInvalid}
									/>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					</form.Field>

					<div className="grid gap-4 sm:grid-cols-3">
						<form.Field name="city">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											{tForms("fields.city")}
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											placeholder={tForms("placeholders.berlin")}
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
						<form.Field name="postalCode">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											{tForms("fields.postalCode")}
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											placeholder={tForms("placeholders.postalCode10115")}
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
						<form.Field name="country">
							{(field) => (
								<Field>
									<FieldLabel htmlFor={field.name}>
										{tForms("fields.country")}
									</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										readOnly
										className="cursor-not-allowed bg-muted"
									/>
								</Field>
							)}
						</form.Field>
					</div>
				</FieldGroup>
			</ContentSection>

			{/* Contact Settings Section */}
			<ContentSection
				title={t("titles.contactSettings")}
				description={t("descriptions.contactSettings")}
			>
				<FieldGroup>
					<div className="grid gap-4 sm:grid-cols-2">
						<form.Field name="phone">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											{tForms("fields.phone")}
										</FieldLabel>
										<PhoneInput
											id={field.name}
											international={false}
											defaultCountry="DE"
											placeholder={tForms("placeholders.phoneExample")}
											value={field.state.value || undefined}
											onBlur={field.handleBlur}
											onChange={(value) => field.handleChange(value || "")}
											aria-invalid={isInvalid}
										/>
										{isInvalid && (
											<FieldError errors={field.state.meta.errors} />
										)}
									</Field>
								);
							}}
						</form.Field>
						<form.Field name="email">
							{(field) => {
								const isInvalid =
									field.state.meta.isTouched && !field.state.meta.isValid;
								return (
									<Field data-invalid={isInvalid}>
										<FieldLabel htmlFor={field.name}>
											{tForms("fields.email")}
										</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type="email"
											placeholder={tForms("placeholders.storeEmail")}
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
					</div>
				</FieldGroup>
			</ContentSection>

			{/* Store Images Section - only show in edit mode */}
			{isEditing && (
				<ContentSection
					title={t("titles.storeImages")}
					description={t("descriptions.storeImages")}
				>
					<Field>
						<FieldLabel>{t("fields.storeLogo")}</FieldLabel>
						<p className="mb-2 text-muted-foreground text-sm">
							{t("hints.storeLogoHint")}
						</p>
						<ImageUploadField
							value={store.logoUrl || undefined}
							onChange={handleLogoChange}
							merchantId={merchantId}
							imageType="store_logo"
						/>
					</Field>
				</ContentSection>
			)}

			{/* Form Actions */}
			<div className="flex justify-end gap-3 border-t pt-6">
				<Button
					type="button"
					variant="outline"
					onClick={() => navigate({ to: "/stores" })}
				>
					{tCommon("buttons.cancel")}
				</Button>
				<LoadingButton
					type="submit"
					isLoading={createStore.isPending || updateStore.isPending}
					loadingText={
						isEditing ? tCommon("states.updating") : tCommon("states.creating")
					}
				>
					{isEditing ? tCommon("buttons.update") : tCommon("buttons.create")}
				</LoadingButton>
			</div>
		</form>
	);
}
