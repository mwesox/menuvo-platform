import { MinusIcon, PlusIcon } from "lucide-react";
import {
	lazy,
	Suspense,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import type { CropperRef } from "react-advanced-cropper";
// CSS is loaded only when the cropper is used
import "react-advanced-cropper/dist/style.css";
import {
	Box,
	Button,
	Dialog,
	HStack,
	Icon,
	Portal,
	Slider,
	Spinner,
	Text,
	VStack,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import type { ImageType } from "../constants.ts";
import {
	type CropPreset,
	getDefaultPreset,
	getPresetsForImageType,
} from "../utils/crop-presets";

// Lazy load the heavy cropper component (~89ms savings)
const Cropper = lazy(() =>
	import("react-advanced-cropper").then((m) => ({ default: m.Cropper })),
);

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
			if (newZoom === undefined) return;
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
		<Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
			<Portal>
				<Dialog.Backdrop />
				<Dialog.Positioner>
					<Dialog.Content maxW="2xl">
						<Dialog.Header>
							<Dialog.Title>{t("images.cropTitle")}</Dialog.Title>
							<Dialog.Description>
								{t("images.cropDescription")}
							</Dialog.Description>
						</Dialog.Header>

						<Dialog.Body>
							<VStack gap="4" align="stretch">
								{/* Preset selector */}
								<HStack gap="2" wrap="wrap">
									{presets.map((preset) => (
										<Button
											key={preset.id}
											type="button"
											variant={
												selectedPreset.id === preset.id ? "solid" : "outline"
											}
											colorPalette={
												selectedPreset.id === preset.id ? "primary" : undefined
											}
											size="sm"
											onClick={() => handlePresetSelect(preset)}
											flexDirection="column"
											alignItems="flex-start"
											gap="0.5"
											h="auto"
											py="2"
											px="3"
										>
											<Text fontWeight="medium" textStyle="sm">
												{t(`images.presets.${preset.labelKey}`)}
											</Text>
											<Text
												textStyle="xs"
												color={
													selectedPreset.id === preset.id
														? "primary-foreground/70"
														: "fg.muted"
												}
											>
												{t(`images.presets.${preset.descriptionKey}`)}
											</Text>
										</Button>
									))}
								</HStack>

								{/* Cropper */}
								<Box
									position="relative"
									h="400px"
									w="full"
									overflow="hidden"
									rounded="lg"
									bg="bg.muted"
								>
									<Suspense
										fallback={
											<Box
												display="flex"
												h="full"
												w="full"
												alignItems="center"
												justifyContent="center"
											>
												<Spinner size="lg" />
											</Box>
										}
									>
										<Cropper
											key={selectedPreset.id} // Force re-render when preset changes
											ref={cropperRef}
											src={imageSrc}
											stencilProps={{
												aspectRatio:
													selectedPreset.id === "free"
														? undefined
														: effectiveAspectRatio,
											}}
											style={{ height: "100%", width: "100%" }}
										/>
									</Suspense>
								</Box>

								{/* Zoom slider */}
								<HStack gap="3" align="center" px="1">
									<Icon w="4" h="4" flexShrink={0} color="fg.muted">
										<MinusIcon />
									</Icon>
									<Slider.Root
										value={[zoom]}
										onValueChange={(e) => handleZoomChange(e.value)}
										min={-50}
										max={50}
										step={1}
										flex="1"
									>
										<Slider.Control>
											<Slider.Track>
												<Slider.Range />
											</Slider.Track>
											<Slider.Thumbs />
										</Slider.Control>
									</Slider.Root>
									<Icon w="4" h="4" flexShrink={0} color="fg.muted">
										<PlusIcon />
									</Icon>
								</HStack>

								{/* Dimension hint */}
								{selectedPreset.minWidth > 0 && (
									<Text textAlign="center" color="fg.muted" textStyle="xs">
										{t("images.recommendedMinimum", {
											width: selectedPreset.minWidth,
											height: selectedPreset.minHeight,
										})}
									</Text>
								)}
							</VStack>
						</Dialog.Body>

						<Dialog.Footer>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
							>
								{t("buttons.cancel")}
							</Button>
							<Button
								type="button"
								onClick={handleCrop}
								disabled={isProcessing}
							>
								{isProcessing ? t("images.processing") : t("images.applyCrop")}
							</Button>
						</Dialog.Footer>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog.Root>
	);
}
