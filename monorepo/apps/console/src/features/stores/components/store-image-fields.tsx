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
} from "@menuvo/ui/card";
import { Field, FieldLabel } from "@menuvo/ui/field";
import { ImageUploadField } from "@/features/images/components/image-upload-field";
import { trpcClient } from "@/lib/trpc";
import { storeKeys } from "../queries";

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
	const queryClient = useQueryClient();

	const handleLogoChange = useCallback(
		async (url: string | undefined) => {
			try {
				await trpcClient.store.updateImage.mutate({
					storeId,
					imageUrl: url ?? null,
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
					<p className="mb-2 text-muted-foreground text-sm">
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
