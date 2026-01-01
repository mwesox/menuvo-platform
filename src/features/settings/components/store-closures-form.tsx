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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import type { StoreClosure } from "@/db/schema";
import {
	storeClosuresQueries,
	useCreateStoreClosure,
	useDeleteStoreClosure,
	useUpdateStoreClosure,
} from "@/features/stores/queries";
import { cn } from "@/lib/utils";

interface StoreClosuresFormProps {
	storeId: number;
}

export function StoreClosuresForm({ storeId }: StoreClosuresFormProps) {
	const { t } = useTranslation("settings");
	const { t: tCommon } = useTranslation("common");
	const { data: closures } = useSuspenseQuery(
		storeClosuresQueries.list(storeId),
	);
	const [isAdding, setIsAdding] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>{t("sections.closures")}</CardTitle>
					<CardDescription>{t("descriptions.closures")}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{closures.length === 0 && !isAdding && (
						<p className="text-muted-foreground text-sm py-4 text-center">
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
					<Plus className="mr-2 h-4 w-4" />
					{t("actions.addClosure")}
				</Button>
			)}
		</div>
	);
}

interface ClosureListItemProps {
	closure: StoreClosure;
	storeId: number;
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
		<div className="flex items-center justify-between py-3 px-4 border rounded-lg">
			<div>
				<p className="font-medium">{dateDisplay}</p>
				{closure.reason && (
					<p className="text-sm text-muted-foreground">{closure.reason}</p>
				)}
			</div>
			<div className="flex items-center gap-2">
				<Button variant="ghost" size="icon" onClick={onEdit}>
					<Pencil className="h-4 w-4" />
				</Button>
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button variant="ghost" size="icon">
							<Trash2 className="h-4 w-4" />
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
	storeId: number;
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
			className="p-4 border rounded-lg space-y-4"
		>
			<div className="grid gap-4 sm:grid-cols-2">
				<form.Field
					name="startDate"
					children={(field) => (
						<div className="space-y-2">
							<Label>{t("labels.startDate")}</Label>
							<DatePicker
								value={field.state.value}
								onChange={field.handleChange}
							/>
						</div>
					)}
				/>

				<form.Field
					name="endDate"
					children={(field) => (
						<div className="space-y-2">
							<Label>{t("labels.endDate")}</Label>
							<DatePicker
								value={field.state.value}
								onChange={field.handleChange}
							/>
						</div>
					)}
				/>
			</div>

			<form.Field
				name="reason"
				children={(field) => (
					<div className="space-y-2">
						<Label>
							{t("labels.reason")} ({tCommon("labels.optional")})
						</Label>
						<Input
							placeholder={t("placeholders.closureReason")}
							value={field.state.value}
							onChange={(e) => field.handleChange(e.target.value)}
						/>
					</div>
				)}
			/>

			<div className="flex justify-end gap-2">
				<Button type="button" variant="outline" onClick={onCancel}>
					{tCommon("buttons.cancel")}
				</Button>
				<form.Subscribe
					selector={(state) => state.isSubmitting}
					children={(isSubmitting) => (
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting
								? tCommon("states.saving")
								: closure
									? tCommon("buttons.update")
									: tCommon("buttons.add")}
						</Button>
					)}
				/>
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
						"w-full justify-start text-left font-normal",
						!date && "text-muted-foreground",
					)}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
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
