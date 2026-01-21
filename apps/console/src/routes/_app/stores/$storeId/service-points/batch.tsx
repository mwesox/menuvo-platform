import {
	Button,
	Card,
	HStack,
	Input,
	ScrollArea,
	SimpleGrid,
	Text,
	VStack,
} from "@chakra-ui/react";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { FormField } from "@/components/ui/form-field";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import { useTRPC, useTRPCClient } from "@/lib/trpc";

export const Route = createFileRoute(
	"/_app/stores/$storeId/service-points/batch",
)({
	component: BatchCreateServicePointsPage,
	errorComponent: ConsoleError,
});

function generateCode(prefix: string, number: number): string {
	return `${prefix.toLowerCase().replace(/\s+/g, "-")}-${number}`;
}

function BatchCreateServicePointsPage() {
	const store = useStore();
	const navigate = useNavigate();
	const { t } = useTranslation("servicePoints");
	const { t: tToasts } = useTranslation("toasts");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();

	const batchCreateMutation = useMutation({
		mutationKey: trpc.store.servicePoints.batchCreate.mutationKey(),
		mutationFn: (input: {
			prefix: string;
			startNumber: number;
			endNumber: number;
			zone?: string;
		}) => {
			const count = input.endNumber - input.startNumber + 1;
			return trpcClient.store.servicePoints.batchCreate.mutate({
				storeId: store.id,
				prefix: input.prefix,
				startNumber: input.startNumber,
				count,
				type: "table",
				zone: input.zone,
			});
		},
		onSuccess: (created) => {
			queryClient.invalidateQueries({
				queryKey: trpc.store.servicePoints.list.queryKey({ storeId: store.id }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.store.servicePoints.getZones.queryKey({
					storeId: store.id,
				}),
			});
			toast.success(
				tToasts("success.servicePointsBatchCreated", { count: created.length }),
			);
			navigate({
				to: "/stores/$storeId/service-points",
				params: { storeId: store.id },
			});
		},
		onError: () => {
			toast.error(tToasts("error.batchCreateServicePoints"));
		},
	});

	// Get existing zones for suggestions
	const { data: existingZones = [] } = useQuery({
		...trpc.store.servicePoints.getZones.queryOptions({ storeId: store.id }),
	});

	const form = useForm({
		defaultValues: {
			prefix: "",
			startNumber: "1",
			endNumber: "10",
			zone: "",
		},
		onSubmit: async ({ value }) => {
			await batchCreateMutation.mutateAsync({
				prefix: value.prefix,
				startNumber: Number.parseInt(value.startNumber, 10),
				endNumber: Number.parseInt(value.endNumber, 10),
				zone: value.zone || undefined,
			});
		},
	});

	const handleCancel = () => {
		navigate({
			to: "/stores/$storeId/service-points",
			params: { storeId: store.id },
		});
	};

	// Generate preview of what will be created
	const generatePreview = (
		prefix: string,
		startNumber: string,
		endNumber: string,
	) => {
		const start = Number.parseInt(startNumber, 10) || 0;
		const end = Number.parseInt(endNumber, 10) || 0;

		if (!prefix || start > end || end - start >= 100) {
			return [];
		}

		const items = [];
		for (let i = start; i <= end; i++) {
			items.push({
				name: `${prefix} ${i}`,
				code: generateCode(prefix, i),
			});
		}
		return items;
	};

	return (
		<VStack gap="6" align="stretch">
			<PageActionBar
				breadcrumbs={[
					{
						label: t("titles.servicePoints"),
						href: `/stores/${store.id}/service-points`,
					},
					{ label: t("batch.title") },
				]}
			/>
			<Card.Root>
				<Card.Header>
					<Card.Title>{t("batch.title")}</Card.Title>
					<Card.Description>{t("batch.description")}</Card.Description>
				</Card.Header>
				<Card.Body>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							form.handleSubmit();
						}}
					>
						<VStack gap="6" align="stretch">
							<form.Field name="prefix">
								{(field) => (
									<FormField
										field={field}
										label={`${t("batch.labels.prefix")} *`}
										description={t("batch.hints.prefix")}
										required
									>
										<Input
											id={field.name}
											name={field.name}
											placeholder={t("batch.placeholders.prefix")}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									</FormField>
								)}
							</form.Field>

							<SimpleGrid columns={2} gap="4">
								<form.Field name="startNumber">
									{(field) => (
										<FormField
											field={field}
											label={t("batch.labels.startNumber")}
										>
											<Input
												id={field.name}
												name={field.name}
												type="number"
												min={0}
												max={9999}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
											/>
										</FormField>
									)}
								</form.Field>

								<form.Field name="endNumber">
									{(field) => (
										<FormField
											field={field}
											label={t("batch.labels.endNumber")}
										>
											<Input
												id={field.name}
												name={field.name}
												type="number"
												min={0}
												max={9999}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
											/>
										</FormField>
									)}
								</form.Field>
							</SimpleGrid>

							<form.Field name="zone">
								{(field) => (
									<FormField
										field={field}
										label={t("labels.zone")}
										description={t("batch.hints.zone")}
									>
										<Input
											id={field.name}
											name={field.name}
											placeholder={t("placeholders.zone")}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											list="batch-zone-suggestions"
										/>
										{existingZones && existingZones.length > 0 && (
											<datalist id="batch-zone-suggestions">
												{existingZones.map((zone) => (
													<option key={zone} value={zone} />
												))}
											</datalist>
										)}
									</FormField>
								)}
							</form.Field>

							{/* Preview */}
							<form.Subscribe
								selector={(state) => ({
									prefix: state.values.prefix,
									startNumber: state.values.startNumber,
									endNumber: state.values.endNumber,
									isSubmitting: state.isSubmitting,
								})}
							>
								{({ prefix, startNumber, endNumber, isSubmitting }) => {
									const preview = generatePreview(
										prefix,
										startNumber,
										endNumber,
									);
									const count = preview.length;
									return (
										<>
											{preview.length > 0 && (
												<VStack gap="2" align="stretch">
													<Text fontWeight="medium" textStyle="sm">
														{t("batch.labels.preview")}
													</Text>
													<ScrollArea.Root
														h="40"
														rounded="md"
														borderWidth="1px"
													>
														<ScrollArea.Viewport>
															<ScrollArea.Content>
																<VStack gap="1" align="stretch" p="3">
																	{preview.slice(0, 5).map((item) => (
																		<HStack
																			key={item.code}
																			justify="space-between"
																			textStyle="sm"
																		>
																			<Text>{item.name}</Text>
																			<Text
																				fontFamily="mono"
																				color="fg.muted"
																				textStyle="xs"
																			>
																				{item.code}
																			</Text>
																		</HStack>
																	))}
																	{preview.length > 5 && (
																		<Text
																			pt="2"
																			color="fg.muted"
																			textStyle="xs"
																		>
																			{t("batch.preview.more", {
																				count: preview.length - 5,
																			})}
																		</Text>
																	)}
																</VStack>
															</ScrollArea.Content>
														</ScrollArea.Viewport>
														<ScrollArea.Scrollbar>
															<ScrollArea.Thumb />
														</ScrollArea.Scrollbar>
													</ScrollArea.Root>
												</VStack>
											)}

											<HStack justify="flex-end" gap="2">
												<Button
													type="button"
													variant="outline"
													onClick={handleCancel}
												>
													{t("buttons.cancel")}
												</Button>
												<Button
													type="submit"
													disabled={isSubmitting || count === 0}
													loading={isSubmitting}
												>
													{isSubmitting
														? t("batch.buttons.creating")
														: t("batch.buttons.create", { count })}
												</Button>
											</HStack>
										</>
									);
								}}
							</form.Subscribe>
						</VStack>
					</form>
				</Card.Body>
			</Card.Root>
		</VStack>
	);
}
