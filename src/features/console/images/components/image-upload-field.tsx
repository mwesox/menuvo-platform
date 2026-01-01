import { CropIcon, ImageIcon, Trash2Icon, UploadIcon } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button.tsx";
import type { ImageType } from "@/db/schema.ts";
import { cn } from "@/lib/utils.ts";
import { deleteImage } from "../server/images.functions.ts";
import { resizeCroppedImage } from "../utils/resize-image.ts";
import { uploadImageBinary } from "../utils/upload-image.ts";
import { ImageCropper } from "./image-cropper.tsx";

interface ImageUploadFieldProps {
	value?: string;
	onChange: (url: string | undefined) => void;
	merchantId: number;
	imageType: ImageType;
	aspectRatio?: number;
	className?: string;
	disabled?: boolean;
}

export function ImageUploadField({
	value,
	onChange,
	merchantId,
	imageType,
	aspectRatio = 1,
	className,
	disabled = false,
}: ImageUploadFieldProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [cropperOpen, setCropperOpen] = useState(false);
	const [previewSrc, setPreviewSrc] = useState<string | null>(null);
	const [currentImageId, setCurrentImageId] = useState<number | null>(null);

	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			// Validate file type
			if (!file.type.startsWith("image/")) {
				toast.error("Please select an image file");
				return;
			}

			// Create preview URL and open cropper
			const url = URL.createObjectURL(file);
			setPreviewSrc(url);
			setCropperOpen(true);

			// Reset input so same file can be selected again
			e.target.value = "";
		},
		[],
	);

	const handleCropComplete = useCallback(
		async (croppedBlob: Blob) => {
			setIsUploading(true);
			try {
				// Resize the cropped image (returns Blob, no base64)
				const resized = await resizeCroppedImage(croppedBlob);

				// Upload binary directly (no base64 encoding - ~33% smaller payload)
				const result = await uploadImageBinary(
					resized.blob,
					merchantId,
					imageType,
					"image.jpg",
				);

				// Use display URL if available, otherwise original
				const imageUrl = result.displayUrl || result.originalUrl;
				onChange(imageUrl);
				setCurrentImageId(result.id);
				toast.success("Image uploaded successfully");
			} catch (error) {
				console.error("Upload failed:", error);
				toast.error("Failed to upload image");
			} finally {
				setIsUploading(false);
				if (previewSrc) {
					URL.revokeObjectURL(previewSrc);
					setPreviewSrc(null);
				}
			}
		},
		[merchantId, imageType, onChange, previewSrc],
	);

	const handleRemove = useCallback(async () => {
		if (!currentImageId) {
			// If no image ID, just clear the URL
			onChange(undefined);
			return;
		}

		try {
			await deleteImage({
				data: {
					imageId: currentImageId,
					merchantId,
				},
			});
			onChange(undefined);
			setCurrentImageId(null);
			toast.success("Image removed");
		} catch (error) {
			console.error("Delete failed:", error);
			toast.error("Failed to remove image");
		}
	}, [currentImageId, merchantId, onChange]);

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
						alt="Preview"
						className="w-full max-w-xs aspect-[4/3] rounded-lg border object-cover"
					/>
					<div className="absolute inset-0 flex items-center justify-center gap-2 rounded-lg bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
						<Button
							type="button"
							size="icon"
							variant="secondary"
							onClick={() => inputRef.current?.click()}
							disabled={disabled || isUploading}
						>
							<CropIcon className="h-4 w-4" />
						</Button>
						<Button
							type="button"
							size="icon"
							variant="destructive"
							onClick={handleRemove}
							disabled={disabled || isUploading}
						>
							<Trash2Icon className="h-4 w-4" />
						</Button>
					</div>
				</div>
			) : (
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					disabled={disabled || isUploading}
					className={cn(
						"flex w-full max-w-xs aspect-[4/3] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary",
						(disabled || isUploading) && "cursor-not-allowed opacity-50",
					)}
				>
					{isUploading ? (
						<>
							<UploadIcon className="h-8 w-8 animate-pulse" />
							<span className="text-sm">Uploading...</span>
						</>
					) : (
						<>
							<ImageIcon className="h-8 w-8" />
							<span className="text-sm">Click to upload image</span>
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
					aspectRatio={aspectRatio}
					onCropComplete={handleCropComplete}
				/>
			)}
		</div>
	);
}
