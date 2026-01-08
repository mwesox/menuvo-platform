import { useForm } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
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
} from "@menuvo/ui/alert-dialog.tsx";
import { Button } from "@menuvo/ui/button.tsx";
import { Calendar } from "@menuvo/ui/calendar.tsx";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@menuvo/ui/card.tsx";
import { Field, FieldLabel } from "@menuvo/ui/field.tsx";
import { Input } from "@menuvo/ui/input.tsx";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@menuvo/ui/popover.tsx";
import type { StoreClosure } from "@menuvo/db/schema.ts";
import {
	storeClosuresQueries,
	useCreateStoreClosure,
	useDeleteStoreClosure,
	useUpdateStoreClosure,
} from "@/features/stores/queries.ts";
import { cn } from "@/lib/utils.ts";

interface StoreClosuresFormProps {
	storeId: string;
}

export function StoreClosuresForm({ storeId }: StoreClosuresFormProps) {
	const { t } = useTranslation("settings");
	const { data: closures } = useSuspenseQuery(
		storeClosuresQueries.list(storeId),
	);
	const [isAdding, setIsAdding] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>{t("sections.closures")}</CardTitle>
					<CardDescription>{t("descriptions.closures")}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{closures.length === 0 && !isAdding && (
						<p className="py-4 text-center text-muted-foreground text-sm">
							{t("emptyStates.noClosures")}
						</p>
					)}

					{closures.map((closure) =>
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
				</CardContent>
			</Card>

			{!isAdding && editingId === null && (
				<Button onClick={() => setIsAdding(true)}>
					<Plus className="me-2 size-4" />
					{t("actions.addClosure")}
				</Button>
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
	const deleteMutation = useDeleteStoreClosure(storeId);

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
								onClick={() => deleteMutation.mutate(closure.id)}
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
	const createMutation = useCreateStoreClosure();
	const updateMutation = useUpdateStoreClosure(storeId);

	const today = new Date();
	const todayStr = format(today, "yyyy-MM-dd");

	const form = useForm({
		defaultValues: {
			startDate: closure?.startDate ?? todayStr,
			endDate: closure?.endDate ?? todayStr,
			reason: closure?.reason ?? "",
		},
		onSubmit: async ({ value }) => {
			if (closure) {
				await updateMutation.mutateAsync({
					id: closure.id,
					startDate: value.startDate,
					endDate: value.endDate,
					reason: value.reason || undefined,
				});
			} else {
				await createMutation.mutateAsync({
					storeId,
					startDate: value.startDate,
					endDate: value.endDate,
					reason: value.reason || undefined,
				});
			}
			onSuccess();
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
					{(field) => (
						<Field>
							<FieldLabel>{t("labels.startDate")}</FieldLabel>
							<DatePicker
								value={field.state.value}
								onChange={field.handleChange}
							/>
						</Field>
					)}
				</form.Field>

				<form.Field name="endDate">
					{(field) => (
						<Field>
							<FieldLabel>{t("labels.endDate")}</FieldLabel>
							<DatePicker
								value={field.state.value}
								onChange={field.handleChange}
							/>
						</Field>
					)}
				</form.Field>
			</div>

			<form.Field name="reason">
				{(field) => (
					<Field>
						<FieldLabel>
							{t("labels.reason")} ({tCommon("labels.optional")})
						</FieldLabel>
						<Input
							placeholder={t("placeholders.closureReason")}
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
						/>
					</Field>
				)}
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
}

function DatePicker({ value, onChange }: DatePickerProps) {
	const { t } = useTranslation("settings");
	const [open, setOpen] = useState(false);
	const date = value ? parseISO(value) : undefined;

	const handleSelect = (selectedDate: Date | undefined) => {
		if (selectedDate) {
			onChange(format(selectedDate, "yyyy-MM-dd"));
			setOpen(false);
		}
	};

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
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
