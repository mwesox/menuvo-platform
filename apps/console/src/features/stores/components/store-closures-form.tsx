import type { AppRouter } from "@menuvo/api/trpc";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	Button,
	Calendar,
	Field,
	FieldError,
	FieldLabel,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@menuvo/ui";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ContentSection } from "@/components/ui/content-section";
import { useTRPC, useTRPCClient } from "@/lib/trpc";
import { cn } from "@/lib/utils.ts";
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
		<div className="space-y-8">
			<ContentSection
				title={t("sections.closures")}
				description={t("descriptions.closures")}
			>
				<div className="space-y-4">
					{closures.length === 0 && !isAdding && (
						<p className="py-4 text-center text-muted-foreground text-sm">
							{t("emptyStates.noClosures")}
						</p>
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
				</div>
			</ContentSection>

			{!isAdding && editingId === null && (
				<div className="flex justify-end border-t pt-6">
					<Button onClick={() => setIsAdding(true)}>
						<Plus className="me-2 size-4" />
						{t("actions.addClosure")}
					</Button>
				</div>
			)}
		</div>
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
		mutationFn: async (input: { id: string }) =>
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

	const dateDisplay = isSingleDay
		? format(startDate, "MMM d, yyyy")
		: `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`;

	return (
		<div className="flex items-center justify-between rounded-lg border px-4 py-3">
			<div>
				<p className="font-medium">{dateDisplay}</p>
				{closure.reason && (
					<p className="text-muted-foreground text-sm">{closure.reason}</p>
				)}
			</div>
			<div className="flex items-center gap-2">
				<Button variant="ghost" size="icon" onClick={onEdit}>
					<Pencil className="size-4" />
				</Button>
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button variant="ghost" size="icon">
							<Trash2 className="size-4" />
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>{t("actions.deleteClosure")}</AlertDialogTitle>
							<AlertDialogDescription>
								{t("confirmations.deleteClosure")}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>{tCommon("buttons.cancel")}</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => deleteMutation.mutate({ id: closure.id })}
							>
								{tCommon("buttons.delete")}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
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
			id: string;
			startDate: string;
			endDate: string;
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
			className="space-y-4 rounded-lg border p-4"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<form.Field name="startDate">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel>{t("labels.startDate")}</FieldLabel>
								<DatePicker
									value={field.state.value}
									onChange={field.handleChange}
									onBlur={field.handleBlur}
									isInvalid={isInvalid}
								/>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>

				<form.Field name="endDate">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel>{t("labels.endDate")}</FieldLabel>
								<DatePicker
									value={field.state.value}
									onChange={field.handleChange}
									onBlur={field.handleBlur}
									isInvalid={isInvalid}
								/>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>
			</div>

			<form.Field name="reason">
				{(field) => {
					const isInvalid =
						field.state.meta.isTouched && !field.state.meta.isValid;
					return (
						<Field data-invalid={isInvalid}>
							<FieldLabel>
								{t("labels.reason")} ({tCommon("labels.optional")})
							</FieldLabel>
							<Input
								name={field.name}
								placeholder={t("placeholders.closureReason")}
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

			<div className="flex justify-end gap-2">
				<Button type="button" variant="outline" onClick={onCancel}>
					{tCommon("buttons.cancel")}
				</Button>
				<form.Subscribe selector={(state) => state.isSubmitting}>
					{(isSubmitting) => (
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting
								? tCommon("states.saving")
								: closure
									? tCommon("buttons.update")
									: tCommon("buttons.add")}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</form>
	);
}

interface DatePickerProps {
	value: string;
	onChange: (value: string) => void;
	onBlur?: () => void;
	isInvalid?: boolean;
}

function DatePicker({ value, onChange, onBlur, isInvalid }: DatePickerProps) {
	const { t } = useTranslation("settings");
	const [open, setOpen] = useState(false);
	const date = value ? parseISO(value) : undefined;

	const handleSelect = (selectedDate: Date | undefined) => {
		if (selectedDate) {
			onChange(format(selectedDate, "yyyy-MM-dd"));
			setOpen(false);
		}
	};

	const handleOpenChange = (isOpen: boolean) => {
		setOpen(isOpen);
		if (!isOpen && onBlur) {
			onBlur();
		}
	};

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					aria-invalid={isInvalid}
					className={cn(
						"w-full justify-start text-start font-normal",
						!date && "text-muted-foreground",
					)}
				>
					<CalendarIcon className="me-2 size-4" />
					{date ? (
						format(date, "PPP")
					) : (
						<span>{t("placeholders.pickDate")}</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					selected={date}
					onSelect={handleSelect}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	);
}
