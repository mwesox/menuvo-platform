import { useForm } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@menuvo/ui/button.tsx";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@menuvo/ui/dialog.tsx";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@menuvo/ui/field.tsx";
import { Input } from "@menuvo/ui/input.tsx";
import { ScrollArea } from "@menuvo/ui/scroll-area.tsx";
import {
	servicePointQueries,
	useBatchCreateServicePoints,
} from "../queries.ts";

interface BatchCreateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	storeId: string;
}

function generateCode(prefix: string, number: number): string {
	return `${prefix.toLowerCase().replace(/\s+/g, "-")}-${number}`;
}

function BatchCreateForm({
	storeId,
	onSuccess,
	onCancel,
}: {
	storeId: string;
	onSuccess?: () => void;
	onCancel?: () => void;
}) {
	const { t } = useTranslation("servicePoints");
	const batchCreateMutation = useBatchCreateServicePoints(storeId);

	// Get existing zones for suggestions
	const { data: existingZones } = useSuspenseQuery(
		servicePointQueries.zones(storeId),
	);

	const form = useForm({
		defaultValues: {
			prefix: "",
			startNumber: "1",
			endNumber: "10",
			zone: "",
		},
		onSubmit: async ({ value }) => {
			try {
				await batchCreateMutation.mutateAsync({
					prefix: value.prefix,
					startNumber: Number.parseInt(value.startNumber, 10),
					endNumber: Number.parseInt(value.endNumber, 10),
					zone: value.zone || undefined,
				});
				onSuccess?.();
			} catch {
				// Error already handled by mutation
			}
		},
	});

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
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			className="space-y-6"
		>
			<FieldGroup>
				<form.Field name="prefix">
					{(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid;
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>
									{t("batch.labels.prefix")} *
								</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									placeholder={t("batch.placeholders.prefix")}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									aria-invalid={isInvalid}
								/>
								<p className="text-muted-foreground text-xs">
									{t("batch.hints.prefix")}
								</p>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>

				<div className="grid grid-cols-2 gap-4">
					<form.Field name="startNumber">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>
										{t("batch.labels.startNumber")}
									</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										type="number"
										min={0}
										max={9999}
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

					<form.Field name="endNumber">
						{(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid}>
									<FieldLabel htmlFor={field.name}>
										{t("batch.labels.endNumber")}
									</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										type="number"
										min={0}
										max={9999}
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
				</div>

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
									list="batch-zone-suggestions"
									aria-invalid={isInvalid}
								/>
								{existingZones && existingZones.length > 0 && (
									<datalist id="batch-zone-suggestions">
										{existingZones.map((zone) => (
											<option key={zone} value={zone} />
										))}
									</datalist>
								)}
								<p className="text-muted-foreground text-xs">
									{t("batch.hints.zone")}
								</p>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						);
					}}
				</form.Field>
			</FieldGroup>

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
					const preview = generatePreview(prefix, startNumber, endNumber);
					const count = preview.length;
					return (
						<>
							{preview.length > 0 && (
								<div className="space-y-2">
									<p className="font-medium text-sm">
										{t("batch.labels.preview")}
									</p>
									<ScrollArea className="h-40 rounded-md border">
										<div className="space-y-1 p-3">
											{preview.slice(0, 5).map((item) => (
												<div
													key={item.code}
													className="flex items-center justify-between text-sm"
												>
													<span>{item.name}</span>
													<span className="font-mono text-muted-foreground text-xs">
														{item.code}
													</span>
												</div>
											))}
											{preview.length > 5 && (
												<p className="pt-2 text-muted-foreground text-xs">
													{t("batch.preview.more", {
														count: preview.length - 5,
													})}
												</p>
											)}
										</div>
									</ScrollArea>
								</div>
							)}

							<div className="flex justify-end gap-2">
								{onCancel && (
									<Button type="button" variant="outline" onClick={onCancel}>
										{t("buttons.cancel")}
									</Button>
								)}
								<Button type="submit" disabled={isSubmitting || count === 0}>
									{isSubmitting
										? t("batch.buttons.creating")
										: t("batch.buttons.create", { count })}
								</Button>
							</div>
						</>
					);
				}}
			</form.Subscribe>
		</form>
	);
}

export function BatchCreateDialog({
	open,
	onOpenChange,
	storeId,
}: BatchCreateDialogProps) {
	const { t } = useTranslation("servicePoints");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{t("batch.title")}</DialogTitle>
					<DialogDescription>{t("batch.description")}</DialogDescription>
				</DialogHeader>
				<Suspense
					fallback={<div className="py-8 text-center">{t("misc.loading")}</div>}
				>
					<BatchCreateForm
						storeId={storeId}
						onSuccess={() => onOpenChange(false)}
						onCancel={() => onOpenChange(false)}
					/>
				</Suspense>
			</DialogContent>
		</Dialog>
	);
}
