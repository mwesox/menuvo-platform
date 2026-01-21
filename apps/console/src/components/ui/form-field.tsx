import { Field } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { FieldError } from "./field-error";

interface FormFieldProps {
	/** TanStack Form field API - accepts any field from TanStack Form */
	field: {
		name: string;
		state: {
			meta: {
				isTouched: boolean;
				isValid: boolean;
				isRequired?: boolean;
				isDisabled?: boolean;
				errors?: Array<string | { message?: string } | undefined>;
			};
		};
	};
	/** Field label */
	label: ReactNode;
	/** Optional description/helper text */
	description?: string;
	/** Whether field is required (overrides field state) */
	required?: boolean;
	/** Whether field is disabled (overrides field state) */
	disabled?: boolean;
	/** Input/control element */
	children: ReactNode;
}

/**
 * FormField - Reusable form field pattern for TanStack Form + Chakra Field integration
 *
 * Provides consistent pattern for form fields with:
 * - Automatic error state handling
 * - Proper accessibility attributes
 * - Consistent styling
 * - Type-safe integration with TanStack Form
 *
 * @example
 * ```tsx
 * <form.Field name="email">
 *   {(field) => (
 *     <FormField field={field} label="Email" required>
 *       <Input
 *         id={field.name}
 *         value={field.state.value}
 *         onChange={(e) => field.handleChange(e.target.value)}
 *         onBlur={field.handleBlur}
 *       />
 *     </FormField>
 *   )}
 * </form.Field>
 * ```
 */
export function FormField({
	field,
	label,
	description,
	required,
	disabled,
	children,
}: FormFieldProps) {
	const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
	const isRequired = required ?? field.state.meta.isRequired ?? false;
	const isDisabled = disabled ?? field.state.meta.isDisabled ?? false;

	return (
		<Field.Root invalid={isInvalid} required={isRequired} disabled={isDisabled}>
			<Field.Label htmlFor={field.name}>
				{typeof label === "string" ? label : label}
			</Field.Label>
			{description && <Field.HelperText>{description}</Field.HelperText>}
			{children}
			{isInvalid && <FieldError errors={field.state.meta.errors} />}
		</Field.Root>
	);
}
