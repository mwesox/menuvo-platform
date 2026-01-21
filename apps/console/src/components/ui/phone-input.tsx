import { Group, Input, NativeSelect } from "@chakra-ui/react";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import {
	COUNTRIES,
	type CountryOption,
	findCountryByCode,
	formatE164,
	parseE164,
} from "./phone-input-countries";

interface PhoneInputProps {
	value: string; // E.164 format (e.g., "+4917612345678")
	onChange: (value: string) => void;
	onBlur?: () => void;
	defaultCountry?: string; // ISO code, default "DE"
	placeholder?: string;
	disabled?: boolean;
	invalid?: boolean;
	id?: string;
	name?: string;
	autoComplete?: string;
	size?: "xs" | "sm" | "md" | "lg" | "xl";
}

/**
 * PhoneInput component with country code selector and phone number input.
 * Outputs E.164 format for backend compatibility.
 *
 * Uses two separate fields:
 * - NativeSelect for country code (flag + dial code)
 * - Input for local phone number
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(
	function PhoneInput(
		{
			value,
			onChange,
			onBlur,
			defaultCountry = "DE",
			placeholder,
			disabled = false,
			invalid = false,
			id,
			name,
			autoComplete,
			size = "md",
		},
		ref,
	) {
		// Memoize default country to prevent unnecessary effect triggers
		// COUNTRIES is a constant non-empty array, so COUNTRIES[0] is always defined
		const defaultCountryOption = useMemo(
			() =>
				findCountryByCode(defaultCountry) ?? (COUNTRIES[0] as CountryOption),
			[defaultCountry],
		);

		// Parse initial value to set correct initial state
		const initialParsed = useMemo(() => {
			if (value) {
				return parseE164(value);
			}
			return null;
		}, []); // Only run once on mount

		// Internal state for country and local number
		const [selectedCountry, setSelectedCountry] = useState<CountryOption>(
			() => initialParsed?.country ?? defaultCountryOption,
		);
		const [localNumber, setLocalNumber] = useState(
			() => initialParsed?.number ?? "",
		);

		// Track last external value to detect external changes
		const lastExternalValue = useRef(value);

		// Sync when external value changes (e.g., form reset)
		useEffect(() => {
			if (value !== lastExternalValue.current) {
				lastExternalValue.current = value;

				if (!value) {
					// Reset to defaults
					setSelectedCountry(defaultCountryOption);
					setLocalNumber("");
					return;
				}

				// Parse the E.164 value
				const parsed = parseE164(value);
				if (parsed) {
					setSelectedCountry(parsed.country);
					setLocalNumber(parsed.number);
				}
			}
		}, [value, defaultCountryOption]);

		// Emit combined E.164 value when country or number changes
		const emitValue = (country: CountryOption, number: string) => {
			const e164 = number ? formatE164(country, number) : "";
			lastExternalValue.current = e164;
			onChange(e164);
		};

		const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
			const country = findCountryByCode(e.target.value);
			if (country) {
				setSelectedCountry(country);
				emitValue(country, localNumber);
			}
		};

		const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const newNumber = e.target.value;
			setLocalNumber(newNumber);
			emitValue(selectedCountry, newNumber);
		};

		const handleBlur = () => {
			onBlur?.();
		};

		return (
			<Group attached>
				<NativeSelect.Root
					size={size}
					width="110px"
					disabled={disabled}
					invalid={invalid}
					variant="outline"
				>
					<NativeSelect.Field
						value={selectedCountry.code}
						onChange={handleCountryChange}
						onBlur={handleBlur}
						aria-label="Country code"
					>
						{COUNTRIES.map((country) => (
							<option key={country.code} value={country.code}>
								{country.flag} {country.dialCode}
							</option>
						))}
					</NativeSelect.Field>
					<NativeSelect.Indicator />
				</NativeSelect.Root>
				<Input
					ref={ref}
					id={id}
					name={name}
					type="tel"
					inputMode="tel"
					autoComplete={autoComplete}
					flex="1"
					size={size}
					placeholder={placeholder}
					value={localNumber}
					onChange={handleNumberChange}
					onBlur={handleBlur}
					disabled={disabled}
					aria-invalid={invalid}
					data-invalid={invalid || undefined}
				/>
			</Group>
		);
	},
);
