import {
	Box,
	Button,
	FileUpload,
	Icon,
	Image,
	Text,
	VStack,
} from "@chakra-ui/react";
import { CropIcon, ImageIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useTRPCClient } from "@/lib/trpc";
import type { ImageType } from "../constants.ts";
import { getAspectRatioClassForImageType } from "../utils/crop-presets.ts";
import { resizeCroppedImage } from "../utils/resize-image.ts";
import { uploadImageBinary } from "../utils/upload-image.ts";
import { ImageCropper } from "./image-cropper.tsx";

interface ImageUploadFieldProps {
	value?: string;
	onChange: (url: string | undefined) => void;
	merchantId: string;
	imageType: ImageType;
	className?: string;
	disabled?: boolean;
}

export function ImageUploadField({
	value,
	onChange,
	merchantId,
	imageType,
	className,
	disabled = false,
}: ImageUploadFieldProps) {
	const { t } = useTranslation("common");
	const [isUploading, setIsUploading] = useState(false);
	const [cropperOpen, setCropperOpen] = useState(false);
	const [previewSrc, setPreviewSrc] = useState<string | null>(null);
	const [currentImageId, setCurrentImageId] = useState<string | null>(null);
	const trpcClient = useTRPCClient();

	const handleFileChange = useCallback(
		(
			details: Parameters<
				NonNullable<
					React.ComponentProps<typeof FileUpload.Root>["onFileChange"]
				>
			>[0],
		) => {
			if (details.acceptedFiles.length > 0) {
				const file = details.acceptedFiles[0];
				if (!file) return;

				// Validate file type (FileUpload should handle this, but double-check)
				if (!file.type.startsWith("image/")) {
					toast.error(t("toasts.pleaseSelectImage"));
					return;
				}

				// Create preview URL and open cropper
				const url = URL.createObjectURL(file);
				setPreviewSrc(url);
				setCropperOpen(true);
			}
		},
		[t],
	);

	const handleCropComplete = useCallback(
		async (croppedBlob: Blob) => {
			setIsUploading(true);
			try {
				// Resize the cropped image (returns Blob, no base64)
				const resized = await resizeCroppedImage(croppedBlob);

				// Upload binary directly (no base64 encoding - ~33% smaller payload)
				const result = await uploadImageBinary(
					trpcClient,
					resized.blob,
					merchantId,
					imageType,
					"image.jpg",
				);

				if (!result) {
					throw new Error("Upload failed - no result returned");
				}

				// Use display URL if available, otherwise original
				const imageUrl = result.displayUrl || result.originalUrl;
				onChange(imageUrl);
				setCurrentImageId(result.id);
				toast.success(t("toasts.imageUploaded"));
			} catch {
				toast.error(t("toasts.imageUploadFailed"));
			} finally {
				setIsUploading(false);
				if (previewSrc) {
					URL.revokeObjectURL(previewSrc);
					setPreviewSrc(null);
				}
				setCropperOpen(false);
			}
		},
		[merchantId, imageType, onChange, previewSrc, t, trpcClient],
	);

	const handleRemove = useCallback(async () => {
		if (!currentImageId) {
			// If no image ID, just clear the URL
			onChange(undefined);
			return;
		}

		try {
			await trpcClient.image.delete.mutate({
				imageId: currentImageId,
				merchantId,
			});
			onChange(undefined);
			setCurrentImageId(null);
			toast.success(t("toasts.imageRemoved"));
		} catch {
			toast.error(t("toasts.imageRemoveFailed"));
		}
	}, [currentImageId, merchantId, onChange, t, trpcClient]);

	const aspectClass = getAspectRatioClassForImageType(imageType);

	return (
		<FileUpload.Root
			maxFiles={1}
			accept="image/*"
			onFileChange={handleFileChange}
			disabled={disabled || isUploading}
		>
			<FileUpload.HiddenInput />
			<VStack gap="2" align="stretch" className={className}>
				{value ? (
					<Box position="relative" maxW="xs" role="group">
						<Image
							src={value}
							alt={t("images.preview")}
							w="full"
							maxW="xs"
							rounded="lg"
							borderWidth="1px"
							objectFit="cover"
							className={aspectClass}
						/>
						<Box
							position="absolute"
							inset="0"
							display="flex"
							alignItems="center"
							justifyContent="center"
							gap="2"
							rounded="lg"
							bg="black/50"
							opacity="0"
							transition="opacity"
							_groupHover={{ opacity: 1 }}
						>
							<FileUpload.Trigger asChild>
								<Button
									type="button"
									size="sm"
									variant="subtle"
									disabled={disabled || isUploading}
								>
									<Icon w="4" h="4">
										<CropIcon />
									</Icon>
								</Button>
							</FileUpload.Trigger>
							<Button
								type="button"
								size="sm"
								variant="subtle"
								colorPalette="red"
								onClick={handleRemove}
								disabled={disabled || isUploading}
							>
								<Icon w="4" h="4">
									<Trash2Icon />
								</Icon>
							</Button>
						</Box>
					</Box>
				) : (
					<FileUpload.Trigger asChild>
						<Button
							type="button"
							disabled={disabled || isUploading}
							display="flex"
							w="full"
							maxW="xs"
							flexDirection="column"
							alignItems="center"
							justifyContent="center"
							gap="2"
							rounded="lg"
							borderWidth="2px"
							borderStyle="dashed"
							color="fg.muted"
							transition="colors"
							_hover={{ borderColor: "primary", color: "primary" }}
							_disabled={{ cursor: "not-allowed", opacity: 0.5 }}
							className={aspectClass}
							variant="ghost"
							h="auto"
							py="8"
						>
							{isUploading ? (
								<>
									<Icon w="8" h="8" animation="pulse">
										<UploadIcon />
									</Icon>
									<Text textStyle="sm">{t("images.uploading")}</Text>
								</>
							) : (
								<>
									<Icon w="8" h="8">
										<ImageIcon />
									</Icon>
									<Text textStyle="sm">{t("images.clickToUpload")}</Text>
								</>
							)}
						</Button>
					</FileUpload.Trigger>
				)}

				{previewSrc && (
					<ImageCropper
						open={cropperOpen}
						onOpenChange={(open) => {
							setCropperOpen(open);
							if (!open && previewSrc) {
								URL.revokeObjectURL(previewSrc);
								setPreviewSrc(null);
							}
						}}
						imageSrc={previewSrc}
						imageType={imageType}
						onCropComplete={handleCropComplete}
					/>
				)}
			</VStack>
		</FileUpload.Root>
	);
}
