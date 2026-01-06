import { AlertCircle, Check, CheckCircle, Loader2, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useApplyImportChanges, useImportJobStatus } from "../queries";
import type { MenuComparisonData } from "../types";
import { ComparisonPanel } from "./comparison-panel";
import { FileDropzone } from "./file-dropzone";
import { ProcessingProgress } from "./processing-progress";

type WizardStep = "upload" | "processing" | "review";

interface ImportWizardProps {
	storeId: number;
	onClose: () => void;
}

export function ImportWizard({ storeId, onClose }: ImportWizardProps) {
	const { t } = useTranslation("menu");
	const [step, setStep] = useState<WizardStep>("upload");
	const [file, setFile] = useState<File | null>(null);
	const [jobId, setJobId] = useState<number | null>(null);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

	// Poll for job status
	const { data: jobStatus, error: jobError } = useImportJobStatus(jobId);

	// Apply mutation
	const applyMutation = useApplyImportChanges(storeId);

	// Auto-advance to review when job is ready
	if (step === "processing" && jobStatus?.status === "READY") {
		setStep("review");
		// Pre-select all items
		if (jobStatus.comparisonData) {
			const allKeys = getAllSelectableKeys(jobStatus.comparisonData);
			setSelectedItems(new Set(allKeys));
		}
	}

	const handleFileSelect = (selectedFile: File) => {
		setFile(selectedFile);
		setUploadError(null);
	};

	const handleClearFile = () => {
		setFile(null);
		setUploadError(null);
	};

	const handleUpload = async () => {
		if (!file) return;

		setIsUploading(true);
		setUploadError(null);

		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("storeId", String(storeId));

			const response = await fetch("/api/menu-import/upload", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || t("import.errors.uploadFailed"));
			}

			const { jobId: newJobId } = await response.json();
			setJobId(newJobId);
			setStep("processing");
		} catch (error) {
			setUploadError(
				error instanceof Error
					? error.message
					: t("import.errors.uploadFailed"),
			);
		} finally {
			setIsUploading(false);
		}
	};

	const toggleSelection = useCallback((key: string) => {
		setSelectedItems((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(key)) {
				newSet.delete(key);
			} else {
				newSet.add(key);
			}
			return newSet;
		});
	}, []);

	const selectAll = useCallback(() => {
		if (jobStatus?.comparisonData) {
			const allKeys = getAllSelectableKeys(jobStatus.comparisonData);
			setSelectedItems(new Set(allKeys));
		}
	}, [jobStatus?.comparisonData]);

	const clearSelection = useCallback(() => {
		setSelectedItems(new Set());
	}, []);

	const handleApply = async () => {
		if (!jobId || !jobStatus?.comparisonData) return;

		const selections = Array.from(selectedItems).map((key) => {
			const [type, ...nameParts] = key.split(":");
			return {
				type: type as "category" | "item" | "optionGroup",
				extractedName: nameParts.join(":"),
				action: "apply" as const,
			};
		});

		await applyMutation.mutateAsync({ jobId, selections });
		onClose();
	};

	return (
		<div className="w-full px-4 py-4">
			{/* Progress Steps */}
			<div className="mb-8 flex items-center justify-center gap-4">
				<StepIndicator
					step={1}
					label={t("import.steps.upload")}
					isActive={step === "upload"}
					isComplete={step !== "upload"}
				/>
				<div className="h-px w-12 bg-border" />
				<StepIndicator
					step={2}
					label={t("import.steps.processing")}
					isActive={step === "processing"}
					isComplete={step === "review"}
				/>
				<div className="h-px w-12 bg-border" />
				<StepIndicator
					step={3}
					label={t("import.steps.review")}
					isActive={step === "review"}
					isComplete={false}
				/>
			</div>

			{/* Step Content */}
			<Card>
				<CardHeader>
					<CardTitle>
						{step === "upload" && t("import.titles.uploadFile")}
						{step === "processing" && t("import.titles.processing")}
						{step === "review" && t("import.titles.reviewChanges")}
					</CardTitle>
					<CardDescription>
						{step === "upload" && t("import.descriptions.upload")}
						{step === "processing" && t("import.descriptions.processing")}
						{step === "review" && t("import.descriptions.review")}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{step === "upload" && (
						<div className="space-y-6">
							<FileDropzone
								onFileSelect={handleFileSelect}
								selectedFile={file}
								onClearFile={handleClearFile}
								error={uploadError}
							/>
							<div className="flex justify-end gap-2">
								<Button variant="outline" onClick={onClose}>
									{t("import.buttons.cancel")}
								</Button>
								<Button onClick={handleUpload} disabled={!file || isUploading}>
									{isUploading ? (
										<>
											<Loader2 className="me-2 size-4 animate-spin" />
											{t("import.status.uploading")}
										</>
									) : (
										<>
											<Upload className="me-2 size-4" />
											{t("import.buttons.uploadProcess")}
										</>
									)}
								</Button>
							</div>
						</div>
					)}

					{step === "processing" && (
						<div className="py-8">
							{jobStatus?.status === "FAILED" || jobError ? (
								<div className="text-center">
									<AlertCircle className="mx-auto mb-4 size-12 text-destructive" />
									<p className="mb-2 font-medium text-destructive text-lg">
										{t("import.errors.processingFailed")}
									</p>
									<p className="mb-4 text-muted-foreground text-sm">
										{jobStatus?.errorMessage || t("import.errors.genericError")}
									</p>
									<Button variant="outline" onClick={onClose}>
										{t("import.buttons.close")}
									</Button>
								</div>
							) : (
								<ProcessingProgress
									isComplete={jobStatus?.status === "READY"}
									isFailed={false}
								/>
							)}
						</div>
					)}

					{step === "review" && jobStatus?.comparisonData && (
						<div className="space-y-6">
							<ComparisonPanel
								comparison={jobStatus.comparisonData}
								selectedItems={selectedItems}
								onToggleSelection={toggleSelection}
								onSelectAll={selectAll}
								onClearSelection={clearSelection}
							/>
							<div className="flex justify-end gap-2">
								<Button variant="outline" onClick={onClose}>
									{t("import.buttons.cancel")}
								</Button>
								<Button
									onClick={handleApply}
									disabled={selectedItems.size === 0 || applyMutation.isPending}
								>
									{applyMutation.isPending ? (
										<>
											<Loader2 className="me-2 size-4 animate-spin" />
											{t("import.status.applying")}
										</>
									) : (
										<>
											<Check className="me-2 size-4" />
											{t("import.buttons.applyChanges", {
												count: selectedItems.size,
											})}
										</>
									)}
								</Button>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

interface StepIndicatorProps {
	step: number;
	label: string;
	isActive: boolean;
	isComplete: boolean;
}

function StepIndicator({
	step,
	label,
	isActive,
	isComplete,
}: StepIndicatorProps) {
	return (
		<div className="flex items-center gap-2">
			<div
				className={`flex size-8 items-center justify-center rounded-full font-medium text-sm ${
					isComplete
						? "bg-primary text-primary-foreground"
						: isActive
							? "bg-primary text-primary-foreground"
							: "bg-muted text-muted-foreground"
				}`}
			>
				{isComplete ? <CheckCircle className="size-4" /> : step}
			</div>
			<span
				className={`text-sm ${isActive || isComplete ? "font-medium" : "text-muted-foreground"}`}
			>
				{label}
			</span>
		</div>
	);
}

function getAllSelectableKeys(comparison: MenuComparisonData): string[] {
	const keys: string[] = [];

	for (const cat of comparison.categories) {
		keys.push(`category:${cat.extracted.name}`);
		for (const item of cat.items) {
			keys.push(`item:${item.extracted.name}`);
		}
	}

	for (const og of comparison.optionGroups) {
		keys.push(`optionGroup:${og.extracted.name}`);
	}

	return keys;
}
