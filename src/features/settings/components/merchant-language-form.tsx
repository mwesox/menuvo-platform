import { useForm } from "@tanstack/react-form";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { merchantQueries, useUpdateMerchantLanguage } from "../queries";
import { languages, merchantLanguageSchema } from "../validation";

interface MerchantLanguageFormProps {
	merchantId: number;
}

export function MerchantLanguageForm({
	merchantId,
}: MerchantLanguageFormProps) {
	const { t } = useTranslation("settings");
	const { t: tForms } = useTranslation("forms");
	const { t: tCommon } = useTranslation("common");
	const { data: merchant } = useSuspenseQuery(
		merchantQueries.detail(merchantId),
	);
	const updateMutation = useUpdateMerchantLanguage();

	const form = useForm({
		defaultValues: {
			primaryLanguage: merchant.primaryLanguage as
				| "en"
				| "de"
				| "fr"
				| "es"
				| "it",
		},
		validators: {
			onSubmit: merchantLanguageSchema,
		},
		onSubmit: async ({ value }) => {
			await updateMutation.mutateAsync({
				merchantId,
				...value,
			});
		},
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				form.handleSubmit();
			}}
			className="space-y-6"
		>
			<Card>
				<CardHeader>
					<CardTitle>{t("sections.languageSettings")}</CardTitle>
					<CardDescription>
						{t("descriptions.languageSettings")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form.Field
						name="primaryLanguage"
						children={(field) => {
							const isInvalid =
								field.state.meta.isTouched && !field.state.meta.isValid;
							return (
								<Field data-invalid={isInvalid} className="max-w-xs">
									<FieldLabel htmlFor={field.name}>
										{tForms("fields.language")}
									</FieldLabel>
									<Select
										name={field.name}
										value={field.state.value}
										onValueChange={(value) =>
											field.handleChange(
												value as "en" | "de" | "fr" | "es" | "it",
											)
										}
									>
										<SelectTrigger id={field.name} aria-invalid={isInvalid}>
											<SelectValue
												placeholder={tForms("placeholders.selectLanguage")}
											/>
										</SelectTrigger>
										<SelectContent>
											{languages.map((lang) => (
												<SelectItem key={lang.value} value={lang.value}>
													{lang.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{isInvalid && <FieldError errors={field.state.meta.errors} />}
								</Field>
							);
						}}
					/>
				</CardContent>
			</Card>

			<form.Subscribe
				selector={(state) => state.isSubmitting}
				children={(isSubmitting) => (
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting
							? tCommon("states.saving")
							: tCommon("buttons.saveChanges")}
					</Button>
				)}
			/>
		</form>
	);
}
