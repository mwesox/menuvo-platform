import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Field,
	FieldLabel,
} from "@menuvo/ui";
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
					queryKey: trpc.store.getById.queryKey({ storeId }),
				});
			} catch {
				toast.error(t("errors.updateLogoFailed"));
			}
		},
		[storeId, queryClient, trpc, trpcClient, t],
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
