import {
	Box,
	Button,
	Card,
	Field,
	HStack,
	Image,
	Input,
	VStack,
} from "@chakra-ui/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
	ArrowLeft,
	Check,
	Copy,
	Download,
	Link as LinkIcon,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { PageActionBar } from "@/components/layout/page-action-bar";
import { useStore } from "@/contexts/store-context";
import { ConsoleError } from "@/features/components/console-error";
import {
	buildFullUrl,
	buildShortUrl,
	copyFullUrl,
	copyShortUrl,
	downloadQRCode,
	generateQRCodeDataUrl,
} from "@/features/service-points/utils/qr-generator";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute(
	"/_app/stores/$storeId/service-points/$servicePointId/qr",
)({
	component: QRCodePage,
	errorComponent: ConsoleError,
});

function QRCodePage() {
	return (
		<Suspense fallback={<QRCodeSkeleton />}>
			<QRCodeContent />
		</Suspense>
	);
}

function QRCodeSkeleton() {
	return (
		<VStack gap="6" align="stretch">
			<Card.Root>
				<Card.Body py="8" textAlign="center" color="fg.muted">
					Loading...
				</Card.Body>
			</Card.Root>
		</VStack>
	);
}

function QRCodeContent() {
	const store = useStore();
	const navigate = useNavigate();
	const { t } = useTranslation("servicePoints");
	const { servicePointId } = Route.useParams();
	const trpc = useTRPC();

	const { data: servicePoint } = useSuspenseQuery({
		...trpc.store.servicePoints.getById.queryOptions({ id: servicePointId }),
	});

	const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
	const [copiedShort, setCopiedShort] = useState(false);
	const [copiedFull, setCopiedFull] = useState(false);

	const shortUrl = buildShortUrl(servicePoint.shortCode);
	const fullUrl = buildFullUrl(store.slug, servicePoint.code);

	useEffect(() => {
		generateQRCodeDataUrl({
			shortCode: servicePoint.shortCode,
			servicePointCode: servicePoint.code,
			size: 300,
		}).then(setQrDataUrl);
	}, [servicePoint.shortCode, servicePoint.code]);

	const handleCopyShort = async () => {
		await copyShortUrl(servicePoint.shortCode);
		setCopiedShort(true);
		toast.success(t("misc.urlCopied"));
		setTimeout(() => setCopiedShort(false), 2000);
	};

	const handleCopyFull = async () => {
		await copyFullUrl(store.slug, servicePoint.code);
		setCopiedFull(true);
		toast.success(t("misc.urlCopied"));
		setTimeout(() => setCopiedFull(false), 2000);
	};

	const handleDownload = async () => {
		await downloadQRCode({
			shortCode: servicePoint.shortCode,
			servicePointCode: servicePoint.code,
			filename: `qr-${servicePoint.code}.png`,
		});
		toast.success(t("misc.qrCodeDownloaded"));
	};

	const handleBack = () => {
		navigate({
			to: "/stores/$storeId/service-points",
			params: { storeId: store.id },
		});
	};

	return (
		<VStack gap="6" align="stretch">
			<PageActionBar
				breadcrumbs={[
					{
						label: t("titles.servicePoints"),
						href: `/stores/${store.id}/service-points`,
					},
					{ label: servicePoint.name },
					{ label: t("labels.qrCode") },
				]}
			/>

			<Card.Root maxW="md" mx="auto" w="full">
				<Card.Header>
					<Card.Title>{servicePoint.name}</Card.Title>
					<Card.Description>
						{t("descriptions.qrCodeDescription")}
					</Card.Description>
				</Card.Header>
				<Card.Body>
					<VStack gap="6" align="center">
						{qrDataUrl ? (
							<Box rounded="lg" borderWidth="1px" bg="white" p="4">
								<Image
									src={qrDataUrl}
									alt={`QR code for ${servicePoint.name}`}
									h="250px"
									w="250px"
								/>
							</Box>
						) : (
							<Box
								display="flex"
								h="282px"
								w="282px"
								alignItems="center"
								justifyContent="center"
								rounded="lg"
								borderWidth="1px"
								bg="bg.muted"
							>
								<Box color="fg.muted">{t("misc.loading")}</Box>
							</Box>
						)}

						<VStack gap="4" align="stretch" w="full">
							{/* Short URL - for QR code / printing */}
							<Field.Root>
								<Field.Label textStyle="xs" color="fg.muted">
									{t("labels.qrCodeUrl", "QR Code URL (for printing)")}
								</Field.Label>
								<HStack gap="2">
									<Input
										value={shortUrl}
										readOnly
										flex="1"
										fontFamily="mono"
										textStyle="sm"
									/>
									<Button
										variant="outline"
										size="sm"
										onClick={handleCopyShort}
										flexShrink="0"
									>
										{copiedShort ? (
											<Check
												style={{ height: "1rem", width: "1rem" }}
												color="var(--chakra-colors-fg-success)"
											/>
										) : (
											<Copy style={{ height: "1rem", width: "1rem" }} />
										)}
									</Button>
								</HStack>
							</Field.Root>

							{/* Full URL - for sharing */}
							<Field.Root>
								<Field.Label textStyle="xs" color="fg.muted">
									{t("labels.shareUrl", "Share URL (human-readable)")}
								</Field.Label>
								<HStack gap="2">
									<Input value={fullUrl} readOnly flex="1" textStyle="sm" />
									<Button
										variant="outline"
										size="sm"
										onClick={handleCopyFull}
										flexShrink="0"
									>
										{copiedFull ? (
											<Check
												style={{ height: "1rem", width: "1rem" }}
												color="var(--chakra-colors-fg-success)"
											/>
										) : (
											<LinkIcon style={{ height: "1rem", width: "1rem" }} />
										)}
									</Button>
								</HStack>
							</Field.Root>

							<Button onClick={handleDownload} w="full">
								<Download
									style={{
										marginRight: "0.5rem",
										height: "1rem",
										width: "1rem",
									}}
								/>
								{t("labels.downloadQrCode")}
							</Button>
						</VStack>
					</VStack>
				</Card.Body>
				<Card.Footer>
					<Button variant="outline" onClick={handleBack} w="full">
						<ArrowLeft
							style={{
								marginRight: "0.5rem",
								height: "1rem",
								width: "1rem",
							}}
						/>
						{t("buttons.backToList")}
					</Button>
				</Card.Footer>
			</Card.Root>
		</VStack>
	);
}
