import {
	Button,
	Card,
	Dialog,
	HStack,
	Icon,
	IconButton,
	Input,
	Popover,
	Portal,
	VStack,
} from "@chakra-ui/react";
import type { AppRouter } from "@menuvo/api/trpc";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { SettingsFormFooter } from "@/components/layout/settings-form-footer";
import { Calendar } from "@/components/ui/calendar";
import { FormField } from "@/components/ui/form-field";
import { FormSection } from "@/components/ui/form-section";
import { Caption, Label } from "@/components/ui/typography";
import { useTRPC, useTRPCClient } from "@/lib/trpc";
import { closureFormSchema } from "../schemas";

type RouterOutput = inferRouterOutputs<AppRouter>;
type StoreClosure = RouterOutput["store"]["closures"]["list"][number];

interface StoreClosuresFormProps {
	storeId: string;
}

export function StoreClosuresForm({ storeId }: StoreClosuresFormProps) {
	const { t } = useTranslation("settings");
	const trpc = useTRPC();
	const { data: closures = [] } = useQuery({
		...trpc.store.closures.list.queryOptions({ storeId }),
	});
	const [isAdding, setIsAdding] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);

	return (
		<VStack gap="6" align="stretch" w="full">
			<FormSection
				title={t("sections.closures")}
				description={t("descriptions.closures")}
			>
				<VStack gap="4" align="stretch">
					{closures.length === 0 && !isAdding && (
						<Caption textAlign="center">{t("emptyStates.noClosures")}</Caption>
					)}

					{closures.map((closure: StoreClosure) =>
						editingId === closure.id ? (
							<ClosureForm
								key={closure.id}
								storeId={storeId}
								closure={closure}
								onSuccess={() => setEditingId(null)}
								onCancel={() => setEditingId(null)}
							/>
						) : (
							<ClosureListItem
								key={closure.id}
								closure={closure}
								storeId={storeId}
								onEdit={() => setEditingId(closure.id)}
							/>
						),
					)}

					{isAdding && (
						<ClosureForm
							storeId={storeId}
							onSuccess={() => setIsAdding(false)}
							onCancel={() => setIsAdding(false)}
						/>
					)}
				</VStack>
			</FormSection>

			{!isAdding && editingId === null && (
				<HStack justify="flex-end">
					<Button onClick={() => setIsAdding(true)}>
						<Icon fontSize="md" me="2">
							<Plus />
						</Icon>
						{t("actions.addClosure")}
					</Button>
				</HStack>
			)}
		</VStack>
	);
}

interface ClosureListItemProps {
	closure: StoreClosure;
	storeId: string;
	onEdit: () => void;
}

function ClosureListItem({ closure, storeId, onEdit }: ClosureListItemProps) {
	const { t } = useTranslation("settings");
	const { t: tCommon } = useTranslation("common");
	const { t: tToasts } = useTranslation("toasts");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		...trpc.store.closures.delete.mutationOptions(),
		mutationFn: async (input: { storeId: string; id: string }) =>
			trpcClient.store.closures.delete.mutate(input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.store.closures.list.queryKey({ storeId }),
			});
			toast.success(tToasts("success.closureDeleted"));
		},
		onError: () => {
			toast.error(tToasts("error.deleteClosure"));
		},
	});

	const startDate = parseISO(closure.startDate);
	const endDate = parseISO(closure.endDate);
	const isSingleDay = closure.startDate === closure.endDate;
	const dateFormatter = new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
	});

	const startLabel = dateFormatter.format(startDate);
	const endLabel = dateFormatter.format(endDate);
	const dateDisplay = isSingleDay ? startLabel : `${startLabel} - ${endLabel}`;

	const [showDeleteDialog, setShowDeleteDialog] = useState(false);

	return (
		<>
			<Card.Root>
				<Card.Body>
					<HStack justify="space-between">
						<VStack align="start" gap="0">
							<Label>{dateDisplay}</Label>
							{closure.reason && <Caption>{closure.reason}</Caption>}
						</VStack>
						<HStack gap="2">
							<IconButton
								variant="ghost"
								size="sm"
								aria-label="Edit"
								onClick={onEdit}
							>
								<Icon fontSize="md">
									<Pencil />
								</Icon>
							</IconButton>
							<IconButton
								variant="ghost"
								size="sm"
								aria-label="Delete"
								onClick={() => setShowDeleteDialog(true)}
							>
								<Icon fontSize="md">
									<Trash2 />
								</Icon>
							</IconButton>
						</HStack>
					</HStack>
				</Card.Body>
			</Card.Root>

			<Dialog.Root
				open={showDeleteDialog}
				onOpenChange={(e) => setShowDeleteDialog(e.open)}
				role="alertdialog"
			>
				<Portal>
					<Dialog.Backdrop />
					<Dialog.Positioner>
						<Dialog.Content>
							<Dialog.Header>
								<Dialog.Title>{t("actions.deleteClosure")}</Dialog.Title>
								<Dialog.Description>
									{t("confirmations.deleteClosure")}
								</Dialog.Description>
							</Dialog.Header>
							<Dialog.Footer>
								<Button
									variant="outline"
									onClick={() => setShowDeleteDialog(false)}
								>
									{tCommon("buttons.cancel")}
								</Button>
								<Button
									colorPalette="red"
									onClick={() => {
										deleteMutation.mutate({ storeId, id: closure.id });
										setShowDeleteDialog(false);
									}}
									loading={deleteMutation.isPending}
								>
									{tCommon("buttons.delete")}
								</Button>
							</Dialog.Footer>
						</Dialog.Content>
					</Dialog.Positioner>
				</Portal>
			</Dialog.Root>
		</>
	);
}

interface ClosureFormProps {
	storeId: string;
	closure?: StoreClosure;
	onSuccess: () => void;
	onCancel: () => void;
}

function ClosureForm({
	storeId,
	closure,
	onSuccess,
	onCancel,
}: ClosureFormProps) {
	const { t } = useTranslation("settings");
	const { t: tCommon } = useTranslation("common");
	const { t: tToasts } = useTranslation("toasts");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();

	const createMutation = useMutation({
		...trpc.store.closures.create.mutationOptions(),
		mutationFn: async (input: {
			storeId: string;
			startDate: string;
			endDate: string;
			reason?: string;
		}) => trpcClient.store.closures.create.mutate(input),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({
				queryKey: trpc.store.closures.list.queryKey({
					storeId: variables.storeId,
				}),
			});
			toast.success(tToasts("success.closureCreated"));
			onSuccess();
		},
		onError: () => {
			toast.error(tToasts("error.createClosure"));
		},
	});

	const updateMutation = useMutation({
		...trpc.store.closures.update.mutationOptions(),
		mutationFn: async (input: {
			storeId: string;
			id: string;
			startDate?: string;
			endDate?: string;
			reason?: string;
		}) => trpcClient.store.closures.update.mutate(input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: trpc.store.closures.list.queryKey({ storeId }),
			});
			toast.success(tToasts("success.closureUpdated"));
			onSuccess();
		},
		onError: () => {
			toast.error(tToasts("error.updateClosure"));
		},
	});

	const today = new Date();
	const todayStr = format(today, "yyyy-MM-dd");

	const form = useForm({
		defaultValues: {
			startDate: closure?.startDate ?? todayStr,
			endDate: closure?.endDate ?? todayStr,
			reason: closure?.reason ?? "",
		},
		validators: {
			onSubmit: closureFormSchema,
		},
		onSubmit: async ({ value }) => {
			if (closure) {
				updateMutation.mutate({
					storeId,
					id: closure.id,
					startDate: value.startDate,
					endDate: value.endDate,
					reason: value.reason || undefined,
				});
			} else {
				createMutation.mutate({
					storeId,
					startDate: value.startDate,
					endDate: value.endDate,
					reason: value.reason || undefined,
				});
			}
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
		>
			<Card.Root>
				<Card.Body>
					<VStack gap="4" align="stretch">
						<HStack gap="4" flexWrap="wrap">
							<form.Field name="startDate">
								{(field) => (
									<FormField field={field} label={t("labels.startDate")}>
										<DatePicker
											value={field.state.value}
											onChange={field.handleChange}
											onBlur={field.handleBlur}
										/>
									</FormField>
								)}
							</form.Field>

							<form.Field name="endDate">
								{(field) => (
									<FormField field={field} label={t("labels.endDate")}>
										<DatePicker
											value={field.state.value}
											onChange={field.handleChange}
											onBlur={field.handleBlur}
										/>
									</FormField>
								)}
							</form.Field>
						</HStack>

						<form.Field name="reason">
							{(field) => (
								<FormField
									field={field}
									label={`${t("labels.reason")} (${tCommon("labels.optional")})`}
								>
									<Input
										id={field.name}
										name={field.name}
										placeholder={t("placeholders.closureReason")}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
								</FormField>
							)}
						</form.Field>

						<form.Subscribe selector={(state) => state.isSubmitting}>
							{(isSubmitting) => (
								<SettingsFormFooter
									isSubmitting={isSubmitting}
									onCancel={onCancel}
									submitText={
										closure ? tCommon("buttons.update") : tCommon("buttons.add")
									}
									submittingText={tCommon("states.saving")}
								/>
							)}
						</form.Subscribe>
					</VStack>
				</Card.Body>
			</Card.Root>
		</form>
	);
}

interface DatePickerProps {
	value: string;
	onChange: (value: string) => void;
	onBlur?: () => void;
}

function DatePicker({ value, onChange, onBlur }: DatePickerProps) {
	const { t } = useTranslation("settings");
	const [open, setOpen] = useState(false);
	const date = value ? parseISO(value) : undefined;
	const dateFormatter = new Intl.DateTimeFormat(undefined, {
		dateStyle: "medium",
	});

	const handleSelect = (selectedDate: Date | undefined) => {
		if (selectedDate) {
			onChange(format(selectedDate, "yyyy-MM-dd"));
			setOpen(false);
		}
	};

	const handleOpenChange = (e: { open: boolean }) => {
		setOpen(e.open);
		if (!e.open && onBlur) {
			onBlur();
		}
	};

	return (
		<Popover.Root open={open} onOpenChange={handleOpenChange}>
			<Popover.Trigger asChild>
				<Button
					variant="outline"
					w="full"
					textStyle="sm"
					color={!date ? "fg.muted" : undefined}
				>
					<Icon fontSize="md" me="2">
						<CalendarIcon />
					</Icon>
					{date ? dateFormatter.format(date) : t("placeholders.pickDate")}
				</Button>
			</Popover.Trigger>
			<Portal>
				<Popover.Positioner>
					<Popover.Content>
						<Calendar
							mode="single"
							selected={date}
							onSelect={handleSelect}
							initialFocus
						/>
					</Popover.Content>
				</Popover.Positioner>
			</Portal>
		</Popover.Root>
	);
}
