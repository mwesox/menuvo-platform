import {
	Button,
	Field,
	HStack,
	Input,
	Separator,
	SimpleGrid,
	VStack,
} from "@chakra-ui/react";
import type { AppRouter } from "@menuvo/api/trpc";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { PhoneInput } from "@/components/ui/phone-input";
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
	/** Skip the wrapper when parent already provides one (e.g., settings page) */
	skipWrapper?: boolean;
}

export function StoreDetailsForm({
	store,
	merchantId,
	skipWrapper,
}: StoreDetailsFormProps) {
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

	const formContent = (
		<>
			{/* Store Details Section */}
			<FormSection
				title={t("titles.storeDetails")}
				description={t("descriptions.storeDetails")}
			>
				<VStack gap="6" align="stretch">
					<form.Field name="name">
						{(field) => (
							<FormField field={field} label={tForms("fields.storeName")}>
								<Input
									id={field.name}
									name={field.name}
									placeholder={tForms("placeholders.downtownLocation")}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</FormField>
						)}
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
						{(field) => (
							<FormField field={field} label={tForms("fields.streetAddress")}>
								<Input
									id={field.name}
									name={field.name}
									placeholder={tForms("placeholders.mainStreet")}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</FormField>
						)}
					</form.Field>

					<SimpleGrid columns={{ base: 1, sm: 3 }} gap="4">
						<form.Field name="city">
							{(field) => (
								<FormField field={field} label={tForms("fields.city")}>
									<Input
										id={field.name}
										name={field.name}
										placeholder={tForms("placeholders.berlin")}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
								</FormField>
							)}
						</form.Field>
						<form.Field name="postalCode">
							{(field) => (
								<FormField field={field} label={tForms("fields.postalCode")}>
									<Input
										id={field.name}
										name={field.name}
										placeholder={tForms("placeholders.postalCode10115")}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
								</FormField>
							)}
						</form.Field>
						<form.Field name="country">
							{(field) => (
								<Field.Root>
									<Field.Label htmlFor={field.name}>
										{tForms("fields.country")}
									</Field.Label>
									<Input
										id={field.name}
										name={field.name}
										value={field.state.value}
										readOnly
										cursor="not-allowed"
										bg="bg.muted"
									/>
								</Field.Root>
							)}
						</form.Field>
					</SimpleGrid>
				</VStack>
			</FormSection>

			{/* Contact Settings Section */}
			<FormSection
				title={t("titles.contactSettings")}
				description={t("descriptions.contactSettings")}
			>
				<SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
					<form.Field name="phone">
						{(field) => (
							<FormField field={field} label={tForms("fields.phone")}>
								<PhoneInput
									id={field.name}
									defaultCountry="DE"
									placeholder={tForms("placeholders.phoneExample")}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={field.handleChange}
								/>
							</FormField>
						)}
					</form.Field>
					<form.Field name="email">
						{(field) => (
							<FormField field={field} label={tForms("fields.email")}>
								<Input
									id={field.name}
									name={field.name}
									type="email"
									placeholder={tForms("placeholders.storeEmail")}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
							</FormField>
						)}
					</form.Field>
				</SimpleGrid>
			</FormSection>

			{/* Store Images Section - only show in edit mode */}
			{isEditing && (
				<FormSection
					title={t("titles.storeImages")}
					description={t("descriptions.storeImages")}
				>
					<Field.Root>
						<Field.Label>{t("fields.storeLogo")}</Field.Label>
						<Field.HelperText>{t("hints.storeLogoHint")}</Field.HelperText>
						<ImageUploadField
							value={store.logoUrl || undefined}
							onChange={handleLogoChange}
							merchantId={merchantId}
							imageType="store_logo"
						/>
					</Field.Root>
				</FormSection>
			)}

			{/* Form Actions */}
			<VStack gap="6" align="stretch">
				<Separator />
				<HStack justify="flex-end" gap="3">
					<Button
						type="button"
						variant="outline"
						onClick={() => navigate({ to: "/stores" })}
					>
						{tCommon("buttons.cancel")}
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
								loading={
									isSubmitting || createStore.isPending || updateStore.isPending
								}
								loadingText={
									isEditing
										? tCommon("states.updating")
										: tCommon("states.creating")
								}
							>
								{isEditing
									? tCommon("buttons.update")
									: tCommon("buttons.create")}
							</Button>
						)}
					</form.Subscribe>
				</HStack>
			</VStack>
		</>
	);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
		>
			{skipWrapper ? (
				formContent
			) : (
				<VStack layerStyle="settingsContent">{formContent}</VStack>
			)}
		</form>
	);
}
