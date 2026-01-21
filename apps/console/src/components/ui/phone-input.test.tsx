import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PhoneInput } from "./phone-input";

// Cleanup after each test to prevent multiple renders accumulating
afterEach(() => {
	cleanup();
});

// Wrapper component with Chakra provider
function renderWithChakra(ui: React.ReactElement) {
	return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe("PhoneInput", () => {
	describe("rendering", () => {
		it("should render country select and phone input", () => {
			const onChange = vi.fn();
			renderWithChakra(
				<PhoneInput value="" onChange={onChange} placeholder="Enter phone" />,
			);

			const select = screen.getByLabelText(/country code/i);
			const input = screen.getByPlaceholderText("Enter phone");

			expect(select).toBeDefined();
			expect(input).toBeDefined();
		});

		it("should default to Germany (+49)", () => {
			const onChange = vi.fn();
			renderWithChakra(<PhoneInput value="" onChange={onChange} />);

			const select = screen.getByLabelText(
				/country code/i,
			) as HTMLSelectElement;
			expect(select.value).toBe("DE");
		});

		it("should use specified defaultCountry", () => {
			const onChange = vi.fn();
			renderWithChakra(
				<PhoneInput value="" onChange={onChange} defaultCountry="AT" />,
			);

			const select = screen.getByLabelText(
				/country code/i,
			) as HTMLSelectElement;
			expect(select.value).toBe("AT");
		});
	});

	describe("controlled value", () => {
		it("should parse E.164 value and display correct country and number", () => {
			const onChange = vi.fn();
			renderWithChakra(
				<PhoneInput value="+4917612345678" onChange={onChange} />,
			);

			const select = screen.getByLabelText(
				/country code/i,
			) as HTMLSelectElement;
			const input = screen.getByRole("textbox") as HTMLInputElement;

			expect(select.value).toBe("DE");
			expect(input.value).toBe("17612345678");
		});

		it("should parse Austrian phone number correctly", () => {
			const onChange = vi.fn();
			renderWithChakra(<PhoneInput value="+43660123456" onChange={onChange} />);

			const select = screen.getByLabelText(
				/country code/i,
			) as HTMLSelectElement;
			const input = screen.getByRole("textbox") as HTMLInputElement;

			expect(select.value).toBe("AT");
			expect(input.value).toBe("660123456");
		});

		it("should handle empty value", () => {
			const onChange = vi.fn();
			renderWithChakra(<PhoneInput value="" onChange={onChange} />);

			const input = screen.getByRole("textbox") as HTMLInputElement;
			expect(input.value).toBe("");
		});
	});

	describe("user interaction", () => {
		it("should emit E.164 format when typing number", () => {
			const onChange = vi.fn();
			renderWithChakra(<PhoneInput value="" onChange={onChange} />);

			const input = screen.getByRole("textbox");
			fireEvent.change(input, { target: { value: "17612345678" } });

			expect(onChange).toHaveBeenCalledWith("+4917612345678");
		});

		it("should strip leading zero from input", () => {
			const onChange = vi.fn();
			renderWithChakra(<PhoneInput value="" onChange={onChange} />);

			const input = screen.getByRole("textbox");
			fireEvent.change(input, { target: { value: "017612345678" } });

			// Should emit without leading zero in E.164
			expect(onChange).toHaveBeenCalledWith("+4917612345678");
		});

		it("should emit new E.164 when changing country", () => {
			const onChange = vi.fn();
			renderWithChakra(
				<PhoneInput value="+4917612345678" onChange={onChange} />,
			);

			const select = screen.getByLabelText(/country code/i);
			fireEvent.change(select, { target: { value: "AT" } });

			// Should use Austrian dial code with same number
			expect(onChange).toHaveBeenCalledWith("+4317612345678");
		});

		it("should emit empty string when number is cleared", () => {
			const onChange = vi.fn();
			renderWithChakra(
				<PhoneInput value="+4917612345678" onChange={onChange} />,
			);

			const input = screen.getByRole("textbox");
			fireEvent.change(input, { target: { value: "" } });

			expect(onChange).toHaveBeenCalledWith("");
		});

		it("should call onBlur when input loses focus", () => {
			const onChange = vi.fn();
			const onBlur = vi.fn();
			renderWithChakra(
				<PhoneInput value="" onChange={onChange} onBlur={onBlur} />,
			);

			const input = screen.getByRole("textbox");
			fireEvent.blur(input);

			expect(onBlur).toHaveBeenCalled();
		});

		it("should call onBlur when select loses focus", () => {
			const onChange = vi.fn();
			const onBlur = vi.fn();
			renderWithChakra(
				<PhoneInput value="" onChange={onChange} onBlur={onBlur} />,
			);

			const select = screen.getByLabelText(/country code/i);
			fireEvent.blur(select);

			expect(onBlur).toHaveBeenCalled();
		});
	});

	describe("external value changes", () => {
		it("should sync when external value changes", () => {
			const onChange = vi.fn();
			const { rerender } = renderWithChakra(
				<PhoneInput value="+4917612345678" onChange={onChange} />,
			);

			// Change to Austrian number
			rerender(
				<ChakraProvider value={defaultSystem}>
					<PhoneInput value="+43660999888" onChange={onChange} />
				</ChakraProvider>,
			);

			const select = screen.getByLabelText(
				/country code/i,
			) as HTMLSelectElement;
			const input = screen.getByRole("textbox") as HTMLInputElement;

			expect(select.value).toBe("AT");
			expect(input.value).toBe("660999888");
		});

		it("should reset to defaults when value becomes empty", () => {
			const onChange = vi.fn();
			const { rerender } = renderWithChakra(
				<PhoneInput
					value="+43660999888"
					onChange={onChange}
					defaultCountry="DE"
				/>,
			);

			// Clear value
			rerender(
				<ChakraProvider value={defaultSystem}>
					<PhoneInput value="" onChange={onChange} defaultCountry="DE" />
				</ChakraProvider>,
			);

			const select = screen.getByLabelText(
				/country code/i,
			) as HTMLSelectElement;
			const input = screen.getByRole("textbox") as HTMLInputElement;

			expect(select.value).toBe("DE"); // Reset to default
			expect(input.value).toBe("");
		});
	});

	describe("disabled state", () => {
		it("should disable both inputs when disabled prop is true", () => {
			const onChange = vi.fn();
			renderWithChakra(<PhoneInput value="" onChange={onChange} disabled />);

			const select = screen.getByLabelText(
				/country code/i,
			) as HTMLSelectElement;
			const input = screen.getByRole("textbox") as HTMLInputElement;

			expect(select.disabled).toBe(true);
			expect(input.disabled).toBe(true);
		});
	});

	describe("invalid state", () => {
		it("should mark input as invalid", () => {
			const onChange = vi.fn();
			renderWithChakra(<PhoneInput value="" onChange={onChange} invalid />);

			const input = screen.getByRole("textbox");
			expect(input.getAttribute("aria-invalid")).toBe("true");
		});
	});

	describe("accessibility", () => {
		it("should have accessible country select", () => {
			const onChange = vi.fn();
			renderWithChakra(<PhoneInput value="" onChange={onChange} />);

			const select = screen.getByLabelText(/country code/i);
			expect(select).toBeDefined();
		});

		it("should have tel input type for phone number field", () => {
			const onChange = vi.fn();
			renderWithChakra(<PhoneInput value="" onChange={onChange} />);

			const input = screen.getByRole("textbox");
			expect(input.getAttribute("type")).toBe("tel");
			expect(input.getAttribute("inputmode")).toBe("tel");
		});

		it("should pass id to phone input", () => {
			const onChange = vi.fn();
			renderWithChakra(
				<PhoneInput value="" onChange={onChange} id="phone-field" />,
			);

			const input = screen.getByRole("textbox");
			expect(input.getAttribute("id")).toBe("phone-field");
		});

		it("should pass name to phone input", () => {
			const onChange = vi.fn();
			renderWithChakra(
				<PhoneInput value="" onChange={onChange} name="phone" />,
			);

			const input = screen.getByRole("textbox");
			expect(input.getAttribute("name")).toBe("phone");
		});
	});
});
