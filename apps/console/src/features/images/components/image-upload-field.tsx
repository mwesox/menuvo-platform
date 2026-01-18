import { Button } from "@menuvo/ui";
import { CropIcon, ImageIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useTRPCClient } from "@/lib/trpc";
import { cn } from "@/lib/utils.ts";
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
	const inputRef = useRef<HTMLInputElement>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [cropperOpen, setCropperOpen] = useState(false);
	const [previewSrc, setPreviewSrc] = useState<string | null>(null);
	const [currentImageId, setCurrentImageId] = useState<string | null>(null);
	const trpcClient = useTRPCClient();

	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			// Validate file type
			if (!file.type.startsWith("image/")) {
				toast.error(t("toasts.pleaseSelectImage"));
				return;
			}

			// Create preview URL and open cropper
			const url = URL.createObjectURL(file);
			setPreviewSrc(url);
			setCropperOpen(true);

			// Reset input so same file can be selected again
			e.target.value = "";
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
		<div className={cn("space-y-2", className)}>
			<input
				ref={inputRef}
				type="file"
				accept="image/*"
				onChange={handleFileSelect}
				className="sr-only"
				disabled={disabled || isUploading}
			/>

			{value ? (
				<div className="group relative max-w-xs">
					<img
						src={value}
						alt={t("images.preview")}
						className={cn(
							"w-full max-w-xs rounded-lg border object-cover",
							aspectClass,
						)}
					/>
					<div className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
						<Button
							type="button"
							size="icon"
							variant="secondary"
							onClick={() => inputRef.current?.click()}
							disabled={disabled || isUploading}
						>
							<CropIcon className="size-4" />
						</Button>
						<Button
							type="button"
							size="icon"
							variant="destructive"
							onClick={handleRemove}
							disabled={disabled || isUploading}
						>
							<Trash2Icon className="size-4" />
						</Button>
					</div>
				</div>
			) : (
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					disabled={disabled || isUploading}
					className={cn(
						"flex w-full max-w-xs flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary",
						aspectClass,
						(disabled || isUploading) && "cursor-not-allowed opacity-50",
					)}
				>
					{isUploading ? (
						<>
							<UploadIcon className="size-8 animate-pulse" />
							<span className="text-sm">{t("images.uploading")}</span>
						</>
					) : (
						<>
							<ImageIcon className="size-8" />
							<span className="text-sm">{t("images.clickToUpload")}</span>
						</>
					)}
				</button>
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
		</div>
	);
}
