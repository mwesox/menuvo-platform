import {
	Box,
	HStack,
	Icon,
	IconButton,
	Input,
	Spinner,
	Text,
	VisuallyHidden,
	VStack,
} from "@chakra-ui/react";
import { AlertTriangle, Check, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

interface ShopUrlDisplayProps {
	/** The slug to display */
	slug: string;
	/** Whether the availability check is in progress */
	isChecking?: boolean;
	/** Whether the slug is available (null = not yet checked) */
	isAvailable?: boolean | null;
	/** First available alternative slug if the primary is taken */
	nextAvailable?: string | null;
}

/**
 * Displays the shop URL with availability status.
 *
 * Modes:
 * - Static: Just shows the URL (when isAvailable is undefined)
 * - Interactive: Shows availability indicator and suggestions
 */
export function ShopUrlDisplay({
	slug,
	isChecking,
	isAvailable,
	nextAvailable,
}: ShopUrlDisplayProps) {
	const { t } = useTranslation("stores");
	const [copied, setCopied] = useState(false);

	// Determine which slug to display based on availability
	const displaySlug =
		isAvailable === false && nextAvailable ? nextAvailable : slug;
	const shopUrl = `https://www.menuvo.app/${displaySlug}`;

	// Show interactive mode when availability is being tracked
	const isInteractive = isAvailable !== undefined;
	// Slug will change on save (showing alternative)
	const willUseAlternative = isAvailable === false && nextAvailable;

	const handleCopy = async () => {
		await navigator.clipboard.writeText(shopUrl);
		setCopied(true);
		toast.success(t("toast.urlCopied"));
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<VStack gap="3" align="stretch" rounded="lg" borderWidth="1px" p="4">
			<VStack gap="0.5" align="stretch">
				<Text fontWeight="medium" textStyle="sm">
					{t("labels.shopUrl")}
				</Text>
				<Text color="fg.muted" textStyle="sm">
					{t("descriptions.shopUrl")}
				</Text>
			</VStack>

			<HStack gap="2" align="center">
				<Box position="relative" flex="1">
					<Input
						value={shopUrl}
						readOnly
						pr={isInteractive ? "10" : undefined}
					/>
					{isInteractive && (
						<Box
							position="absolute"
							insetY="0"
							right="0"
							display="flex"
							alignItems="center"
							pr="3"
							pointerEvents="none"
						>
							{isChecking ? (
								<>
									<Spinner size="xs" color="fg.muted" />
									<VisuallyHidden>Checking availability...</VisuallyHidden>
								</>
							) : isAvailable ? (
								<>
									<Icon w="4" h="4" color="success">
										<Check />
									</Icon>
									<VisuallyHidden>Available</VisuallyHidden>
								</>
							) : (
								<>
									<Icon w="4" h="4" color="warning">
										<AlertTriangle />
									</Icon>
									<VisuallyHidden>Not available</VisuallyHidden>
								</>
							)}
						</Box>
					)}
				</Box>
				<IconButton
					variant="outline"
					size="sm"
					onClick={handleCopy}
					aria-label={t("actions.copyUrl")}
				>
					{copied ? (
						<Icon w="4" h="4" color="success">
							<Check />
						</Icon>
					) : (
						<Icon w="4" h="4">
							<Copy />
						</Icon>
					)}
				</IconButton>
				<IconButton
					variant="outline"
					size="sm"
					asChild
					aria-label={t("actions.openShop")}
				>
					<a href={shopUrl} target="_blank" rel="noopener noreferrer">
						<Icon w="4" h="4">
							<ExternalLink />
						</Icon>
					</a>
				</IconButton>
			</HStack>

			{/* Show message when using alternative slug */}
			{willUseAlternative && (
				<Text textStyle="sm" color="warning">
					{t("slugTaken", {
						original: slug,
						alternative: nextAvailable,
						defaultValue: `"${slug}" is taken. Will be saved as "${nextAvailable}".`,
					})}
				</Text>
			)}
		</VStack>
	);
}
