import { useCallback, useEffect, useRef, useState } from "react";
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
import { cn } from "@/lib/utils";
import type { ImageType } from "@/db/schema";
import {
	type CropPreset,
	getDefaultPreset,
	getPresetsForImageType,
} from "../utils/crop-presets";

interface ImageCropperProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	imageSrc: string;
	/** @deprecated Use imageType instead for preset-based aspect ratios */
	aspectRatio?: number;
	/** Image type determines available presets and default aspect ratio */
	imageType?: ImageType;
	onCropComplete: (croppedBlob: Blob) => void;
}

export function ImageCropper({
	open,
	onOpenChange,
	imageSrc,
	aspectRatio: legacyAspectRatio,
	imageType = "item_image",
	onCropComplete,
}: ImageCropperProps) {
	const cropperRef = useRef<CropperRef>(null);
	const [isProcessing, setIsProcessing] = useState(false);

	// Get presets for this image type
	const presets = getPresetsForImageType(imageType);
	const defaultPreset = getDefaultPreset(imageType);

	// Track selected preset
	const [selectedPreset, setSelectedPreset] = useState<CropPreset>(defaultPreset);

	// Reset to default preset when dialog opens or image type changes
	useEffect(() => {
		if (open) {
			setSelectedPreset(defaultPreset);
		}
	}, [open, defaultPreset]);

	// Calculate effective aspect ratio (preset takes priority, then legacy prop)
	const effectiveAspectRatio =
		selectedPreset.aspectRatio ||
		legacyAspectRatio ||
		1;

	const handlePresetSelect = useCallback((preset: CropPreset) => {
		setSelectedPreset(preset);
	}, []);

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
						Select a crop preset or adjust freely. The first option is optimized for this image type.
					</DialogDescription>
				</DialogHeader>

				{/* Preset selector */}
				<div className="flex flex-wrap gap-2">
					{presets.map((preset) => (
						<button
							key={preset.id}
							type="button"
							onClick={() => handlePresetSelect(preset)}
							className={cn(
								"px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
								"flex flex-col items-start gap-0.5",
								selectedPreset.id === preset.id
									? "bg-primary text-primary-foreground border-primary"
									: "bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground",
							)}
						>
							<span>{preset.label}</span>
							<span className={cn(
								"text-xs",
								selectedPreset.id === preset.id
									? "text-primary-foreground/70"
									: "text-muted-foreground/70",
							)}>
								{preset.description}
							</span>
						</button>
					))}
				</div>

				{/* Cropper */}
				<div className="relative h-[400px] w-full overflow-hidden rounded-lg bg-muted">
					<Cropper
						key={selectedPreset.id} // Force re-render when preset changes
						ref={cropperRef}
						src={imageSrc}
						stencilProps={{
							aspectRatio: selectedPreset.id === "free" ? undefined : effectiveAspectRatio,
						}}
						className="h-full w-full"
					/>
				</div>

				{/* Dimension hint */}
				{selectedPreset.minWidth > 0 && (
					<p className="text-xs text-muted-foreground text-center">
						Recommended minimum: {selectedPreset.minWidth} x {selectedPreset.minHeight}px
					</p>
				)}

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
