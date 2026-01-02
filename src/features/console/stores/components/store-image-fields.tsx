import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { ImageUploadField } from "@/features/console/images/components/image-upload-field";
import { storeKeys } from "../queries";
import { updateStoreImage } from "../server/stores.functions";

interface StoreImageFieldsProps {
	storeId: number;
	merchantId: number;
	logoUrl?: string | null;
}

export function StoreImageFields({
	storeId,
	merchantId,
	logoUrl,
}: StoreImageFieldsProps) {
	const { t } = useTranslation("stores");
	const queryClient = useQueryClient();

	const handleLogoChange = useCallback(
		async (url: string | undefined) => {
			try {
				await updateStoreImage({
					data: {
						storeId,
						imageUrl: url,
					},
				});
				queryClient.invalidateQueries({ queryKey: storeKeys.detail(storeId) });
			} catch {
				toast.error(t("errors.updateLogoFailed"));
			}
		},
		[storeId, queryClient, t],
	);

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("titles.storeImages")}</CardTitle>
				<CardDescription>{t("descriptions.storeImages")}</CardDescription>
			</CardHeader>
			<CardContent>
				<Field>
					<FieldLabel>{t("fields.storeLogo")}</FieldLabel>
					<p className="text-sm text-muted-foreground mb-2">
						{t("hints.storeLogoHint")}
					</p>
					<ImageUploadField
						value={logoUrl || undefined}
						onChange={handleLogoChange}
						merchantId={merchantId}
						imageType="store_logo"
					/>
				</Field>
			</CardContent>
		</Card>
	);
}
