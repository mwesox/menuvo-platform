import {
	Button,
	HStack,
	Icon,
	Input,
	NativeSelect,
	Text,
	VStack,
} from "@chakra-ui/react";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Caption } from "@/components/ui/typography";

type AttributeValue = string | number | boolean;
type Attributes = Record<string, AttributeValue>;

interface AttributesEditorProps {
	value: Attributes;
	onChange: (value: Attributes) => void;
}

type ValueType = "string" | "number" | "boolean";

function getValueType(value: AttributeValue): ValueType {
	if (typeof value === "boolean") return "boolean";
	if (typeof value === "number") return "number";
	return "string";
}

function parseValue(value: string, type: ValueType): AttributeValue {
	switch (type) {
		case "boolean":
			return value === "true";
		case "number":
			return Number.parseFloat(value) || 0;
		default:
			return value;
	}
}

export function AttributesEditor({ value, onChange }: AttributesEditorProps) {
	const { t } = useTranslation("servicePoints");
	const [newKey, setNewKey] = useState("");
	const [newValue, setNewValue] = useState("");
	const [newType, setNewType] = useState<ValueType>("string");

	const entries = Object.entries(value);

	const handleAddAttribute = () => {
		if (!newKey.trim()) return;
		if (newKey in value) return; // Don't allow duplicate keys

		const parsedValue = parseValue(newValue, newType);
		onChange({ ...value, [newKey.trim()]: parsedValue });
		setNewKey("");
		setNewValue("");
		setNewType("string");
	};

	const handleRemoveAttribute = (key: string) => {
		const { [key]: _, ...rest } = value;
		onChange(rest);
	};

	const handleUpdateValue = (key: string, newVal: string, type: ValueType) => {
		onChange({ ...value, [key]: parseValue(newVal, type) });
	};

	return (
		<VStack gap="3" align="stretch">
			{entries.length > 0 && (
				<VStack gap="2" align="stretch">
					{entries.map(([key, val]) => {
						const type = getValueType(val);
						return (
							<HStack key={key} gap="2" align="center">
								<Input value={key} disabled w="1/3" bg="bg.muted" />
								{type === "boolean" ? (
									<NativeSelect.Root w="1/3">
										<NativeSelect.Field
											value={String(val)}
											onChange={(e) =>
												handleUpdateValue(key, e.target.value, "boolean")
											}
										>
											<option value="true">true</option>
											<option value="false">false</option>
										</NativeSelect.Field>
										<NativeSelect.Indicator />
									</NativeSelect.Root>
								) : (
									<Input
										type={type === "number" ? "number" : "text"}
										value={String(val)}
										onChange={(e) =>
											handleUpdateValue(key, e.target.value, type)
										}
										w="1/3"
									/>
								)}
								<Text w="20" color="fg.muted" textStyle="xs">
									{type}
								</Text>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									flexShrink={0}
									colorPalette="red"
									onClick={() => handleRemoveAttribute(key)}
								>
									<Icon w="4" h="4">
										<Trash2 />
									</Icon>
								</Button>
							</HStack>
						);
					})}
				</VStack>
			)}

			<HStack gap="2" align="center" borderTopWidth="1px" pt="3">
				<Input
					placeholder={t("placeholders.key")}
					value={newKey}
					onChange={(e) => setNewKey(e.target.value)}
					w="1/3"
				/>
				{newType === "boolean" ? (
					<NativeSelect.Root w="1/3">
						<NativeSelect.Field
							value={newValue}
							onChange={(e) => setNewValue(e.target.value)}
						>
							<option value="">{t("placeholders.value")}</option>
							<option value="true">true</option>
							<option value="false">false</option>
						</NativeSelect.Field>
						<NativeSelect.Indicator />
					</NativeSelect.Root>
				) : (
					<Input
						type={newType === "number" ? "number" : "text"}
						placeholder={t("placeholders.value")}
						value={newValue}
						onChange={(e) => setNewValue(e.target.value)}
						w="1/3"
					/>
				)}
				<NativeSelect.Root w="20">
					<NativeSelect.Field
						value={newType}
						onChange={(e) => setNewType(e.target.value as ValueType)}
					>
						<option value="string">{t("attributeTypes.text")}</option>
						<option value="number">{t("attributeTypes.number")}</option>
						<option value="boolean">{t("attributeTypes.boolean")}</option>
					</NativeSelect.Field>
					<NativeSelect.Indicator />
				</NativeSelect.Root>
				<Button
					type="button"
					variant="outline"
					size="sm"
					flexShrink={0}
					onClick={handleAddAttribute}
					disabled={!newKey.trim()}
				>
					<Icon w="4" h="4">
						<Plus />
					</Icon>
				</Button>
			</HStack>

			{entries.length === 0 && (
				<Caption>{t("emptyStates.noAttributes")}</Caption>
			)}
		</VStack>
	);
}
