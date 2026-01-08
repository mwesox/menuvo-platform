import { MinusIcon, PlusIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Cropper, type CropperRef } from "react-advanced-cropper";
import "react-advanced-cropper/dist/style.css";
import { useTranslation } from "react-i18next";
import { Button } from "@menuvo/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@menuvo/ui/dialog";
import { Slider } from "@menuvo/ui/slider";
import type { ImageType } from "@menuvo/db/schema";
import { cn } from "@/lib/utils";
import {
	type CropPreset,
	getDefaultPreset,
	getPresetsForImageType,
} from "../utils/crop-presets";

interface ImageCropperProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	imageSrc: string;
	/** Image type determines available presets and default aspect ratio */
	imageType: ImageType;
	onCropComplete: (croppedBlob: Blob) => void;
}

export function ImageCropper({
	open,
	onOpenChange,
	imageSrc,
	imageType,
	onCropComplete,
}: ImageCropperProps) {
	const { t } = useTranslation("common");
	const cropperRef = useRef<CropperRef>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [zoom, setZoom] = useState(0);

	// Get presets for this image type
	const presets = getPresetsForImageType(imageType);
	const defaultPreset = getDefaultPreset(imageType);

	// Track selected preset
	const [selectedPreset, setSelectedPreset] =
		useState<CropPreset>(defaultPreset);

	// Reset to default preset and zoom when dialog opens or image type changes
	useEffect(() => {
		if (open) {
			setSelectedPreset(defaultPreset);
			setZoom(0);
		}
	}, [open, defaultPreset]);

	// Get aspect ratio from selected preset (0 = free aspect)
	const effectiveAspectRatio = selectedPreset.aspectRatio || 1;

	const handlePresetSelect = useCallback((preset: CropPreset) => {
		setSelectedPreset(preset);
	}, []);

	const handleZoomChange = useCallback(
		(value: number[]) => {
			const newZoom = value[0];
			const delta = newZoom - zoom;
			if (cropperRef.current && delta !== 0) {
				// Convert slider delta to zoom ratio (positive = zoom in, negative = zoom out)
				const zoomRatio = 1 + delta * 0.02;
				cropperRef.current.zoomImage(zoomRatio);
			}
			setZoom(newZoom);
		},
		[zoom],
	);

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
					<DialogTitle>{t("images.cropTitle")}</DialogTitle>
					<DialogDescription>{t("images.cropDescription")}</DialogDescription>
				</DialogHeader>

				{/* Preset selector */}
				<div className="flex flex-wrap gap-2">
					{presets.map((preset) => (
						<button
							key={preset.id}
							type="button"
							onClick={() => handlePresetSelect(preset)}
							className={cn(
								"rounded-lg border px-3 py-2 font-medium text-sm transition-colors",
								"flex flex-col items-start gap-0.5",
								selectedPreset.id === preset.id
									? "border-primary bg-primary text-primary-foreground"
									: "border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
							)}
						>
							<span>{t(`images.presets.${preset.labelKey}`)}</span>
							<span
								className={cn(
									"text-xs",
									selectedPreset.id === preset.id
										? "text-primary-foreground/70"
										: "text-muted-foreground/70",
								)}
							>
								{t(`images.presets.${preset.descriptionKey}`)}
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
							aspectRatio:
								selectedPreset.id === "free" ? undefined : effectiveAspectRatio,
						}}
						className="h-full w-full"
					/>
				</div>

				{/* Zoom slider */}
				<div className="flex items-center gap-3 px-1">
					<MinusIcon className="size-4 shrink-0 text-muted-foreground" />
					<Slider
						value={[zoom]}
						onValueChange={handleZoomChange}
						min={-50}
						max={50}
						step={1}
						className="flex-1"
					/>
					<PlusIcon className="size-4 shrink-0 text-muted-foreground" />
				</div>

				{/* Dimension hint */}
				{selectedPreset.minWidth > 0 && (
					<p className="text-center text-muted-foreground text-xs">
						{t("images.recommendedMinimum", {
							width: selectedPreset.minWidth,
							height: selectedPreset.minHeight,
						})}
					</p>
				)}

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						{t("buttons.cancel")}
					</Button>
					<Button type="button" onClick={handleCrop} disabled={isProcessing}>
						{isProcessing ? t("images.processing") : t("images.applyCrop")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
