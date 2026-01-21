import { Card, Field, Text } from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ImageUploadField } from "@/features/images/components/image-upload-field";
import { useTRPC, useTRPCClient } from "@/lib/trpc";

interface StoreImageFieldsProps {
	storeId: string;
	merchantId: string;
	logoUrl?: string | null;
}

export function StoreImageFields({
	storeId,
	merchantId,
	logoUrl,
}: StoreImageFieldsProps) {
	const { t } = useTranslation("stores");
	const trpc = useTRPC();
	const trpcClient = useTRPCClient();
	const queryClient = useQueryClient();

	const handleLogoChange = useCallback(
		async (url: string | undefined) => {
			try {
				await trpcClient.store.updateImage.mutate({
					storeId,
					imageUrl: url ?? null,
				});
				queryClient.invalidateQueries({
					queryKey: trpc.store.getWithDetails.queryKey({ storeId }),
				});
			} catch {
				toast.error(t("errors.updateLogoFailed"));
			}
		},
		[storeId, queryClient, trpc, trpcClient, t],
	);

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{t("titles.storeImages")}</Card.Title>
				<Card.Description>{t("descriptions.storeImages")}</Card.Description>
			</Card.Header>
			<Card.Body>
				<Field.Root>
					<Field.Label>{t("fields.storeLogo")}</Field.Label>
					<Text mb="2" color="fg.muted" textStyle="sm">
						{t("hints.storeLogoHint")}
					</Text>
					<ImageUploadField
						value={logoUrl || undefined}
						onChange={handleLogoChange}
						merchantId={merchantId}
						imageType="store_logo"
					/>
				</Field.Root>
			</Card.Body>
		</Card.Root>
	);
}
