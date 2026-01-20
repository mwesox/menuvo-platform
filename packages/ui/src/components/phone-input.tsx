import { CheckIcon, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import { cn } from "../lib/utils";
import { Button } from "./button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { ScrollArea } from "./scroll-area";

type PhoneInputProps = Omit<
	React.ComponentProps<"input">,
	"onChange" | "value" | "ref"
> &
	Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
		onChange?: (value: RPNInput.Value) => void;
	};

const PhoneInput: React.ForwardRefExoticComponent<PhoneInputProps> =
	React.forwardRef<
		React.ComponentRef<typeof RPNInput.default>,
		PhoneInputProps
	>(({ className, onChange, value, ...props }, ref) => {
		return (
			<RPNInput.default
				ref={ref}
				className={cn(
					"flex h-9 w-full rounded-md border border-input bg-transparent px-3 shadow-xs",
					"focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
					className,
				)}
				flagComponent={FlagComponent}
				countrySelectComponent={CountrySelect}
				inputComponent={InputComponent}
				smartCaret={false}
				value={value || undefined}
				onChange={(value) => onChange?.(value || ("" as RPNInput.Value))}
				{...props}
			/>
		);
	});
PhoneInput.displayName = "PhoneInput";

const InputComponent = React.forwardRef<
	HTMLInputElement,
	React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
	<input
		className={cn(
			"flex-1 border-0 bg-transparent py-1 outline-none",
			"text-base text-foreground md:text-sm",
			"placeholder:text-muted-foreground",
			className,
		)}
		ref={ref}
		{...props}
	/>
));
InputComponent.displayName = "InputComponent";

type CountryEntry = { label: string; value: RPNInput.Country | undefined };

type CountrySelectProps = {
	disabled?: boolean;
	value: RPNInput.Country;
	options: CountryEntry[];
	onChange: (country: RPNInput.Country) => void;
};

function CountrySelect({
	disabled,
	value: selectedCountry,
	options: countryList,
	onChange,
}: CountrySelectProps) {
	const [open, setOpen] = React.useState(false);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					className="flex h-auto gap-1 rounded-none border-0 px-2 py-1 shadow-none ring-0 hover:bg-transparent focus:outline-none focus:ring-0 focus-visible:ring-0"
					disabled={disabled}
				>
					<FlagComponent
						country={selectedCountry}
						countryName={selectedCountry}
					/>
					<ChevronsUpDown
						className={cn(
							"-mr-2 size-4 opacity-50",
							disabled ? "hidden" : "opacity-100",
						)}
					/>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[300px] p-0">
				<Command>
					<CommandInput placeholder="Search country..." />
					<CommandList>
						<ScrollArea className="h-72">
							<CommandEmpty>No country found.</CommandEmpty>
							<CommandGroup>
								{countryList.map(({ value, label }) =>
									value ? (
										<CountrySelectOption
											key={value}
											country={value}
											countryName={label}
											selectedCountry={selectedCountry}
											onChange={onChange}
											onSelect={() => setOpen(false)}
										/>
									) : null,
								)}
							</CommandGroup>
						</ScrollArea>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}

interface CountrySelectOptionProps {
	country: RPNInput.Country;
	countryName: string;
	selectedCountry: RPNInput.Country;
	onChange: (country: RPNInput.Country) => void;
	onSelect: () => void;
}

function CountrySelectOption({
	country,
	countryName,
	selectedCountry,
	onChange,
	onSelect,
}: CountrySelectOptionProps) {
	return (
		<CommandItem
			className="gap-2"
			onSelect={() => {
				onChange(country);
				onSelect();
			}}
		>
			<FlagComponent country={country} countryName={countryName} />
			<span className="flex-1 text-sm">{countryName}</span>
			<span className="text-muted-foreground text-sm">
				{`+${RPNInput.getCountryCallingCode(country)}`}
			</span>
			<CheckIcon
				className={cn(
					"ml-auto size-4",
					country === selectedCountry ? "opacity-100" : "opacity-0",
				)}
			/>
		</CommandItem>
	);
}

function FlagComponent({ country, countryName }: RPNInput.FlagProps) {
	const Flag = flags[country];

	return (
		<span className="flex h-5 w-7 overflow-hidden rounded-sm [&_svg]:size-full">
			{Flag && <Flag title={countryName} />}
		</span>
	);
}

export { PhoneInput };
