import { useCallback, useRef, useState } from "react";
import { Cropper, type CropperRef } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface ImageCropperProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	imageSrc: string;
	aspectRatio?: number;
	onCropComplete: (croppedBlob: Blob) => void;
}

export function ImageCropper({
	open,
	onOpenChange,
	imageSrc,
	aspectRatio = 1,
	onCropComplete,
}: ImageCropperProps) {
	const cropperRef = useRef<CropperRef>(null);
	const [isProcessing, setIsProcessing] = useState(false);

	const handleCrop = useCallback(async () => {
		if (!cropperRef.current) return;

		setIsProcessing(true);
		try {
			const canvas = cropperRef.current.getCanvas();
			if (!canvas) {
				throw new Error("Failed to get canvas");
			}

			const blob = await new Promise<Blob>((resolve, reject) => {
				canvas.toBlob(
					(blob) => {
						if (blob) resolve(blob);
						else reject(new Error("Failed to create blob"));
					},
					"image/jpeg",
					0.9,
				);
			});

			onCropComplete(blob);
			onOpenChange(false);
		} finally {
			setIsProcessing(false);
		}
	}, [onCropComplete, onOpenChange]);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Crop Image</DialogTitle>
					<DialogDescription>
						Adjust the crop area to select the portion of the image you want to
						use.
					</DialogDescription>
				</DialogHeader>

				<div className="relative h-[400px] w-full overflow-hidden rounded-lg bg-muted">
					<Cropper
						ref={cropperRef}
						src={imageSrc}
						stencilProps={{
							aspectRatio,
						}}
						className="h-full w-full"
					/>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button type="button" onClick={handleCrop} disabled={isProcessing}>
						{isProcessing ? "Processing..." : "Apply Crop"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
