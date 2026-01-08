import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@menuvo/ui/button.tsx";
import { Input } from "@menuvo/ui/input.tsx";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@menuvo/ui/select.tsx";

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
		<div className="space-y-3">
			{entries.length > 0 && (
				<div className="space-y-2">
					{entries.map(([key, val]) => {
						const type = getValueType(val);
						return (
							<div key={key} className="flex items-center gap-2">
								<Input value={key} disabled className="w-1/3 bg-muted" />
								{type === "boolean" ? (
									<Select
										value={String(val)}
										onValueChange={(v) => handleUpdateValue(key, v, "boolean")}
									>
										<SelectTrigger className="w-1/3">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="true">true</SelectItem>
											<SelectItem value="false">false</SelectItem>
										</SelectContent>
									</Select>
								) : (
									<Input
										type={type === "number" ? "number" : "text"}
										value={String(val)}
										onChange={(e) =>
											handleUpdateValue(key, e.target.value, type)
										}
										className="w-1/3"
									/>
								)}
								<span className="w-20 text-muted-foreground text-xs">
									{type}
								</span>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									className="shrink-0 text-destructive hover:bg-destructive/10"
									onClick={() => handleRemoveAttribute(key)}
								>
									<Trash2 className="size-4" />
								</Button>
							</div>
						);
					})}
				</div>
			)}

			<div className="flex items-center gap-2 border-t pt-3">
				<Input
					placeholder={t("placeholders.key")}
					value={newKey}
					onChange={(e) => setNewKey(e.target.value)}
					className="w-1/3"
				/>
				{newType === "boolean" ? (
					<Select value={newValue} onValueChange={setNewValue}>
						<SelectTrigger className="w-1/3">
							<SelectValue placeholder={t("placeholders.value")} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="true">true</SelectItem>
							<SelectItem value="false">false</SelectItem>
						</SelectContent>
					</Select>
				) : (
					<Input
						type={newType === "number" ? "number" : "text"}
						placeholder={t("placeholders.value")}
						value={newValue}
						onChange={(e) => setNewValue(e.target.value)}
						className="w-1/3"
					/>
				)}
				<Select
					value={newType}
					onValueChange={(v) => setNewType(v as ValueType)}
				>
					<SelectTrigger className="w-20">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="string">{t("attributeTypes.text")}</SelectItem>
						<SelectItem value="number">{t("attributeTypes.number")}</SelectItem>
						<SelectItem value="boolean">
							{t("attributeTypes.boolean")}
						</SelectItem>
					</SelectContent>
				</Select>
				<Button
					type="button"
					variant="outline"
					size="icon"
					className="shrink-0"
					onClick={handleAddAttribute}
					disabled={!newKey.trim()}
				>
					<Plus className="size-4" />
				</Button>
			</div>

			{entries.length === 0 && (
				<p className="text-muted-foreground text-sm">
					{t("emptyStates.noAttributes")}
				</p>
			)}
		</div>
	);
}
