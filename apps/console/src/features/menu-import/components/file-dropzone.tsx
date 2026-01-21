import {
	Box,
	Button,
	FileUpload,
	HStack,
	Icon,
	Text,
	VStack,
} from "@chakra-ui/react";
import { FileJson, FileSpreadsheet, FileText, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Caption, Label } from "@/components/ui/typography";
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
			return (
				<Icon w="8" h="8" color="fg.success">
					<FileSpreadsheet />
				</Icon>
			);
		case "json":
			return (
				<Icon w="8" h="8" color="fg.warning">
					<FileJson />
				</Icon>
			);
		default:
			return (
				<Icon w="8" h="8" color="fg.info">
					<FileText />
				</Icon>
			);
	}
}

// Custom dropzone content
function DropzoneContent() {
	const { t } = useTranslation("menu");

	return (
		<VStack gap="4" align="center">
			<Icon w="10" h="10" mx="auto" color="fg.muted">
				<Upload />
			</Icon>
			<Caption>{t("import.dropzone.dragAndDrop")}</Caption>
			<Text color="fg.muted" textStyle="xs">
				{t("import.dropzone.supportedFormats")}
			</Text>
			<FileUpload.Trigger asChild>
				<Button type="button" variant="outline">
					{t("import.buttons.browseFiles")}
				</Button>
			</FileUpload.Trigger>
		</VStack>
	);
}

export function FileDropzone({
	onFileSelect,
	selectedFile,
	onClearFile,
	error,
}: FileDropzoneProps) {
	const { t } = useTranslation("menu");
	const [validationError, setValidationError] = useState<string | null>(null);

	const validateFile = useCallback(
		(file: File) => {
			// Check file size
			if (file.size > MAX_FILE_SIZE) {
				setValidationError(t("import.errors.fileTooLarge"));
				return false;
			}

			// Check file extension
			const ext = getFileExtension(file.name);
			if (!isValidFileType(ext)) {
				setValidationError(
					t("import.errors.invalidFileType", {
						types: allowedFileTypes.join(", "),
					}),
				);
				return false;
			}

			setValidationError(null);
			return true;
		},
		[t],
	);

	const handleClear = useCallback(() => {
		setValidationError(null);
		onClearFile();
	}, [onClearFile]);

	const displayError = error || validationError;

	// Convert allowed file types to accept format
	const acceptExtensions = allowedFileTypes.map((ext) => `.${ext}`).join(",");

	return (
		<FileUpload.Root
			maxFiles={1}
			maxFileSize={MAX_FILE_SIZE}
			accept={acceptExtensions}
			acceptedFiles={selectedFile ? [selectedFile] : []}
			onFileChange={(
				details: Parameters<
					NonNullable<
						React.ComponentProps<typeof FileUpload.Root>["onFileChange"]
					>
				>[0],
			) => {
				// Handle accepted files
				if (details.acceptedFiles.length > 0) {
					const file = details.acceptedFiles[0];
					if (file && validateFile(file)) {
						onFileSelect(file);
					}
				}
				// Handle rejected files
				if (details.rejectedFiles.length > 0) {
					const rejected = details.rejectedFiles[0];
					if (rejected) {
						const file = rejected.file;
						const ext = getFileExtension(file.name);

						if (file.size > MAX_FILE_SIZE) {
							setValidationError(t("import.errors.fileTooLarge"));
						} else if (!isValidFileType(ext)) {
							setValidationError(
								t("import.errors.invalidFileType", {
									types: allowedFileTypes.join(", "),
								}),
							);
						} else if (rejected.errors.length > 0) {
							// Use the first error message if available
							const error = rejected.errors[0] as { message?: string };
							setValidationError(
								error?.message ||
									t("import.errors.invalidFileType", {
										types: allowedFileTypes.join(", "),
									}),
							);
						}
					}
				}
				// Clear file when FileUpload clears it
				if (details.acceptedFiles.length === 0 && selectedFile) {
					handleClear();
				}
			}}
			validate={
				((file: File) => {
					const errors: Array<{ code: string; message: string }> = [];

					// File size validation
					if (file.size > MAX_FILE_SIZE) {
						errors.push({
							code: "file-too-large",
							message: t("import.errors.fileTooLarge"),
						});
					}

					// File type validation
					const ext = getFileExtension(file.name);
					if (!isValidFileType(ext)) {
						errors.push({
							code: "file-invalid-type",
							message: t("import.errors.invalidFileType", {
								types: allowedFileTypes.join(", "),
							}),
						});
					}

					return errors.length > 0 ? errors : null;
					// biome-ignore lint/suspicious/noExplicitAny: FileError type from internal zag-js module
				}) as any
			}
		>
			<FileUpload.HiddenInput />
			<VStack gap="4" align="stretch">
				{selectedFile ? (
					<Box rounded="lg" borderWidth="1px" p="4">
						<HStack justify="space-between" align="center">
							<HStack gap="3" align="center">
								{getFileIcon(selectedFile.name)}
								<VStack gap="0" align="start">
									<Label>{selectedFile.name}</Label>
									<Text color="fg.muted" textStyle="xs">
										{formatFileSize(selectedFile.size)}
									</Text>
								</VStack>
							</HStack>
							<FileUpload.ClearTrigger asChild>
								<Button variant="ghost" size="sm" onClick={handleClear}>
									<Icon w="4" h="4">
										<X />
									</Icon>
								</Button>
							</FileUpload.ClearTrigger>
						</HStack>
					</Box>
				) : (
					<FileUpload.Dropzone
						rounded="lg"
						borderWidth="2px"
						borderStyle="dashed"
						p="8"
						textAlign="center"
						transition="colors"
						borderColor={displayError ? "destructive" : "border.subtle"}
						_hover={!displayError ? { borderColor: "border" } : undefined}
					>
						<FileUpload.DropzoneContent>
							<DropzoneContent />
						</FileUpload.DropzoneContent>
					</FileUpload.Dropzone>
				)}
				{displayError && (
					<Text color="fg.error" textStyle="sm">
						{displayError}
					</Text>
				)}
			</VStack>
		</FileUpload.Root>
	);
}
