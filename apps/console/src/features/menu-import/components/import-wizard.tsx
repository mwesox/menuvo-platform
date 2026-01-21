import {
	Box,
	Button,
	Card,
	Center,
	Icon,
	Spinner,
	Steps,
	Text,
	VStack,
} from "@chakra-ui/react";
import type { AppRouter } from "@menuvo/api/trpc";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { inferRouterInputs } from "@trpc/server";
import { AlertCircle, Check, Upload } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useTRPC, useTRPCClient } from "@/lib/trpc";
import type { ImportJobStatusResponse, MenuComparisonData } from "../schemas";
import { ComparisonPanel } from "./comparison-panel";
import { FileDropzone } from "./file-dropzone";
import { ProcessingProgress } from "./processing-progress";

interface ImportWizardProps {
	storeId: string;
	onClose: () => void;
}

const STEP_UPLOAD = 0;
const STEP_PROCESSING = 1;
const STEP_REVIEW = 2;

export function ImportWizard({ storeId, onClose }: ImportWizardProps) {
	const { t } = useTranslation("menu");
	const [step, setStep] = useState(STEP_UPLOAD);
	const [file, setFile] = useState<File | null>(null);
	const [jobId, setJobId] = useState<string | null>(null);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

	const { t: tCommon } = useTranslation("common");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();

	// Upload mutation
	const uploadMutation = useMutation({
		mutationKey: trpc.menu.import.upload.mutationKey(),
		mutationFn: async (file: File) => {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("storeId", storeId);
			return trpcClient.menu.import.upload.mutate(formData);
		},
		onError: () => {
			toast.error(tCommon("toasts.uploadFailed"));
		},
	});

	// Poll for job status
	const { data: jobStatus, error: jobError } = useQuery({
		queryKey: trpc.menu.import.getJobStatus.queryKey({ jobId: jobId ?? "" }),
		queryFn: async () => {
			if (jobId === null) throw new Error("Job ID required");
			const result = await trpcClient.menu.import.getJobStatus.query({ jobId });
			return result as ImportJobStatusResponse;
		},
		enabled: jobId !== null,
		refetchInterval: (query) => {
			const data = query.state.data;
			// Stop polling when job is complete or failed
			if (
				data?.status === "READY" ||
				data?.status === "FAILED" ||
				data?.status === "COMPLETED"
			) {
				return false;
			}
			// Poll every 2 seconds while processing
			return 2000;
		},
		staleTime: 1000,
		select: (data): ImportJobStatusResponse => data as ImportJobStatusResponse,
	});

	type RouterInput = inferRouterInputs<AppRouter>;
	type ApplyImportChangesInput = RouterInput["menu"]["import"]["applyChanges"];

	// Apply mutation
	const applyMutation = useMutation({
		mutationKey: trpc.menu.import.applyChanges.mutationKey(),
		mutationFn: (input: Omit<ApplyImportChangesInput, "storeId">) =>
			trpcClient.menu.import.applyChanges.mutate({
				storeId,
				...input,
			}),
		onSuccess: () => {
			// Invalidate all menu queries to refresh data
			queryClient.invalidateQueries({
				queryKey: trpc.menu.queries.getCategories.queryKey({ storeId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.menu.items.listByStore.queryKey({ storeId }),
			});
			queryClient.invalidateQueries({
				queryKey: trpc.menu.options.listGroups.queryKey({ storeId }),
			});
			toast.success(tCommon("toasts.importApplied"));
		},
		onError: () => {
			toast.error(tCommon("toasts.importFailed"));
		},
	});

	// Auto-advance to review when job is ready
	if (step === STEP_PROCESSING && jobStatus?.status === "READY") {
		setStep(STEP_REVIEW);
		// Pre-select all items
		if (jobStatus.comparisonData) {
			const allKeys = getAllSelectableKeys(jobStatus.comparisonData);
			setSelectedItems(new Set(allKeys));
		}
	}

	const handleFileSelect = (selectedFile: File) => {
		setFile(selectedFile);
		setUploadError(null);
	};

	const handleClearFile = () => {
		setFile(null);
		setUploadError(null);
	};

	const handleUpload = async () => {
		if (!file) return;

		setUploadError(null);

		try {
			const result = await uploadMutation.mutateAsync(file);
			setJobId(result.jobId);
			setStep(STEP_PROCESSING);
		} catch (error) {
			setUploadError(
				error instanceof Error
					? error.message
					: t("import.errors.uploadFailed"),
			);
		}
	};

	const toggleSelection = useCallback((key: string) => {
		setSelectedItems((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(key)) {
				newSet.delete(key);
			} else {
				newSet.add(key);
			}
			return newSet;
		});
	}, []);

	const selectAll = useCallback(() => {
		if (jobStatus?.comparisonData) {
			const allKeys = getAllSelectableKeys(jobStatus.comparisonData);
			setSelectedItems(new Set(allKeys));
		}
	}, [jobStatus?.comparisonData]);

	const clearSelection = useCallback(() => {
		setSelectedItems(new Set());
	}, []);

	const handleApply = async () => {
		if (!jobId || !jobStatus?.comparisonData) return;

		const selections = Array.from(selectedItems).map((key) => {
			const [type, ...nameParts] = key.split(":");
			return {
				type: type as "category" | "item" | "optionGroup",
				extractedName: nameParts.join(":"),
				action: "apply" as const,
			};
		});

		await applyMutation.mutateAsync({ jobId, selections });
		onClose();
	};

	const steps = [
		{ title: t("import.steps.upload") },
		{ title: t("import.steps.processing") },
		{ title: t("import.steps.review") },
	];

	return (
		<VStack gap="8" w="full">
			{/* Centered Stepper */}
			<Center w="full">
				<Steps.Root
					step={step}
					count={steps.length}
					size="md"
					w="full"
					maxW="lg"
				>
					<Steps.List>
						{steps.map((s, index) => (
							<Steps.Item key={index} index={index}>
								<Steps.Indicator>
									<Steps.Status
										incomplete={<Steps.Number />}
										complete={<Check />}
									/>
								</Steps.Indicator>
								<Steps.Title>{s.title}</Steps.Title>
								<Steps.Separator />
							</Steps.Item>
						))}
					</Steps.List>
				</Steps.Root>
			</Center>

			{/* Step Content */}
			<Box w="full">
				{/* Upload Step */}
				{step === STEP_UPLOAD && (
					<Card.Root>
						<Card.Header>
							<Card.Title>{t("import.titles.uploadFile")}</Card.Title>
							<Card.Description>
								{t("import.descriptions.upload")}
							</Card.Description>
						</Card.Header>
						<Card.Body>
							<FileDropzone
								onFileSelect={handleFileSelect}
								selectedFile={file}
								onClearFile={handleClearFile}
								error={uploadError}
							/>
						</Card.Body>
						<Card.Footer justifyContent="flex-end" gap="2">
							<Button variant="outline" onClick={onClose}>
								{t("import.buttons.cancel")}
							</Button>
							<Button
								onClick={handleUpload}
								disabled={!file || uploadMutation.isPending}
							>
								{uploadMutation.isPending ? (
									<>
										<Spinner size="sm" me="2" />
										{t("import.status.uploading")}
									</>
								) : (
									<>
										<Icon w="4" h="4" me="2">
											<Upload />
										</Icon>
										{t("import.buttons.uploadProcess")}
									</>
								)}
							</Button>
						</Card.Footer>
					</Card.Root>
				)}

				{/* Processing Step */}
				{step === STEP_PROCESSING && (
					<Card.Root>
						<Card.Body py="12">
							{jobStatus?.status === "FAILED" || jobError ? (
								<VStack gap="4">
									<Icon w="12" h="12" color="fg.error">
										<AlertCircle />
									</Icon>
									<Text fontWeight="medium" color="fg.error" textStyle="lg">
										{t("import.errors.processingFailed")}
									</Text>
									<Text color="fg.muted" textStyle="sm" textAlign="center">
										{jobStatus?.errorMessage || t("import.errors.genericError")}
									</Text>
									<Button variant="outline" onClick={onClose}>
										{t("import.buttons.close")}
									</Button>
								</VStack>
							) : (
								<ProcessingProgress
									isComplete={jobStatus?.status === "READY"}
									isFailed={false}
								/>
							)}
						</Card.Body>
					</Card.Root>
				)}

				{/* Review Step */}
				{step === STEP_REVIEW && jobStatus?.comparisonData && (
					<Card.Root>
						<Card.Header>
							<Card.Title>{t("import.titles.reviewChanges")}</Card.Title>
							<Card.Description>
								{t("import.descriptions.review")}
							</Card.Description>
						</Card.Header>
						<Card.Body>
							<ComparisonPanel
								comparison={jobStatus.comparisonData}
								selectedItems={selectedItems}
								onToggleSelection={toggleSelection}
								onSelectAll={selectAll}
								onClearSelection={clearSelection}
							/>
						</Card.Body>
						<Card.Footer justifyContent="flex-end" gap="2">
							<Button variant="outline" onClick={onClose}>
								{t("import.buttons.cancel")}
							</Button>
							<Button
								onClick={handleApply}
								disabled={selectedItems.size === 0 || applyMutation.isPending}
							>
								{applyMutation.isPending ? (
									<>
										<Spinner size="sm" me="2" />
										{t("import.status.applying")}
									</>
								) : (
									<>
										<Icon w="4" h="4" me="2">
											<Check />
										</Icon>
										{t("import.buttons.applyChanges", {
											count: selectedItems.size,
										})}
									</>
								)}
							</Button>
						</Card.Footer>
					</Card.Root>
				)}
			</Box>
		</VStack>
	);
}

function getAllSelectableKeys(comparison: MenuComparisonData): string[] {
	const keys: string[] = [];

	for (const cat of comparison.categories) {
		keys.push(`category:${cat.extracted.name}`);
		for (const item of cat.items) {
			keys.push(`item:${item.extracted.name}`);
		}
	}

	for (const og of comparison.optionGroups) {
		keys.push(`optionGroup:${og.extracted.name}`);
	}

	return keys;
}
