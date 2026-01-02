import { FileJson, FileSpreadsheet, FileText, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type AllowedFileType, allowedFileTypes } from "../validation";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface FileDropzoneProps {
	onFileSelect: (file: File) => void;
	selectedFile: File | null;
	onClearFile: () => void;
	error?: string | null;
}

function getFileExtension(filename: string): string {
	return filename.split(".").pop()?.toLowerCase() || "";
}

function isValidFileType(ext: string): ext is AllowedFileType {
	return allowedFileTypes.includes(ext as AllowedFileType);
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(filename: string) {
	const ext = getFileExtension(filename);
	switch (ext) {
		case "xlsx":
		case "csv":
			return <FileSpreadsheet className="h-8 w-8 text-green-600" />;
		case "json":
			return <FileJson className="h-8 w-8 text-yellow-600" />;
		default:
			return <FileText className="h-8 w-8 text-blue-600" />;
	}
}

export function FileDropzone({
	onFileSelect,
	selectedFile,
	onClearFile,
	error,
}: FileDropzoneProps) {
	const { t } = useTranslation("menu");
	const [isDragActive, setIsDragActive] = useState(false);
	const [validationError, setValidationError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const validateAndSelectFile = useCallback(
		(file: File) => {
			setValidationError(null);

			// Check file size
			if (file.size > MAX_FILE_SIZE) {
				setValidationError(t("import.errors.fileTooLarge"));
				return;
			}

			// Check file extension
			const ext = getFileExtension(file.name);
			if (!isValidFileType(ext)) {
				setValidationError(
					t("import.errors.invalidFileType", {
						types: allowedFileTypes.join(", "),
					}),
				);
				return;
			}

			onFileSelect(file);
		},
		[onFileSelect, t],
	);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			setIsDragActive(false);

			const file = e.dataTransfer?.files[0];
			if (file) {
				validateAndSelectFile(file);
			}
		},
		[validateAndSelectFile],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragActive(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		setIsDragActive(false);
	}, []);

	const handleFileInput = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (file) {
				validateAndSelectFile(file);
			}
		},
		[validateAndSelectFile],
	);

	const displayError = error || validationError;

	if (selectedFile) {
		return (
			<div className="border rounded-lg p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						{getFileIcon(selectedFile.name)}
						<div>
							<p className="text-sm font-medium">{selectedFile.name}</p>
							<p className="text-xs text-muted-foreground">
								{formatFileSize(selectedFile.size)}
							</p>
						</div>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => {
							onClearFile();
							setValidationError(null);
						}}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</div>
		);
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			inputRef.current?.click();
		}
	};

	return (
		// biome-ignore lint/a11y/useSemanticElements: Dropzone needs div for drag-drop events
		<div
			role="button"
			tabIndex={0}
			className={cn(
				"border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
				isDragActive && "border-primary bg-primary/5",
				displayError && "border-destructive",
				!isDragActive &&
					!displayError &&
					"border-muted-foreground/25 hover:border-muted-foreground/50",
			)}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			onClick={() => inputRef.current?.click()}
			onKeyDown={handleKeyDown}
		>
			<Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
			<p className="text-sm text-muted-foreground mb-2">
				{t("import.dropzone.dragAndDrop")}
			</p>
			<p className="text-xs text-muted-foreground mb-4">
				{t("import.dropzone.supportedFormats")}
			</p>
			<Button
				type="button"
				variant="outline"
				onClick={(e) => {
					e.stopPropagation();
					inputRef.current?.click();
				}}
			>
				{t("import.buttons.browseFiles")}
			</Button>
			<input
				ref={inputRef}
				type="file"
				accept=".xlsx,.csv,.json,.md,.txt"
				onChange={handleFileInput}
				className="hidden"
			/>
			{displayError && (
				<p className="text-sm text-destructive mt-4">{displayError}</p>
			)}
		</div>
	);
}
