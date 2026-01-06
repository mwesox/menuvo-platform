import { FileJson, FileSpreadsheet, FileText, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type AllowedFileType, allowedFileTypes } from "../schemas";

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
			return <FileSpreadsheet className="size-8 text-green-600" />;
		case "json":
			return <FileJson className="size-8 text-yellow-600" />;
		default:
			return <FileText className="size-8 text-blue-600" />;
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
			<div className="rounded-lg border p-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						{getFileIcon(selectedFile.name)}
						<div>
							<p className="font-medium text-sm">{selectedFile.name}</p>
							<p className="text-muted-foreground text-xs">
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
						<X className="size-4" />
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
				"cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
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
			<Upload className="mx-auto mb-4 size-10 text-muted-foreground" />
			<p className="mb-2 text-muted-foreground text-sm">
				{t("import.dropzone.dragAndDrop")}
			</p>
			<p className="mb-4 text-muted-foreground text-xs">
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
				<p className="mt-4 text-destructive text-sm">{displayError}</p>
			)}
		</div>
	);
}
