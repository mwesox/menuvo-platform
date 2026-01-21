import { Field } from "@chakra-ui/react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

interface FieldErrorProps {
	/**
	 * Array of error messages from TanStack Form.
	 * Can be strings or objects with message property.
	 * Supports "validation:" prefixed keys for i18n translation.
	 */
	errors?: Array<string | { message?: string } | undefined>;
}

/**
 * Chakra-compatible FieldError component that handles translation.
 *
 * Extracts and translates error messages from TanStack Form field errors.
 * Supports "validation:" prefixed translation keys (e.g., "validation:phone.required").
 *
 * @example
 * ```tsx
 * <Field.Root invalid={hasError}>
 *   <Input {...props} />
 *   {hasError && <FieldError errors={field.state.meta.errors} />}
 * </Field.Root>
 * ```
 */
export function FieldError({ errors }: FieldErrorProps) {
	const { t, i18n } = useTranslation("validation");

	const content = useMemo(() => {
		if (!errors || errors.length === 0) {
			return null;
		}

		// Extract messages from errors (handles both string and object formats)
		const messages = errors
			.map((error) => {
				if (!error) return undefined;
				if (typeof error === "string") return error;
				return error.message;
			})
			.filter((msg): msg is string => Boolean(msg));

		if (messages.length === 0) {
			return null;
		}

		// Deduplicate messages
		const uniqueMessages = [...new Set(messages)];

		// Translate messages - supports "validation:" prefixed keys
		const translateError = (message: string): string => {
			if (message.startsWith("validation:")) {
				const key = message.replace("validation:", "");
				const translated = t(key);
				// If translation exists, use it; otherwise return the key for debugging
				return i18n.exists(`validation:${key}`) ? translated : message;
			}
			// Return plain text as-is
			return message;
		};

		if (uniqueMessages.length === 1) {
			const firstMessage = uniqueMessages[0];
			if (!firstMessage) return null;
			return translateError(firstMessage);
		}

		// Multiple errors - render as list
		return (
			<ul style={{ marginLeft: "1rem", listStyleType: "disc" }}>
				{uniqueMessages.map((message) => (
					<li key={message}>{translateError(message)}</li>
				))}
			</ul>
		);
	}, [errors, t, i18n]);

	if (!content) {
		return null;
	}

	return <Field.ErrorText>{content}</Field.ErrorText>;
}
