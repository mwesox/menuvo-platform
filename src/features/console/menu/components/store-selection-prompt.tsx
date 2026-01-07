import { useNavigate } from "@tanstack/react-router";
import { Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";

interface StoreSelectionPromptProps {
	stores: Array<{ id: string; name: string }>;
}

export function StoreSelectionPrompt({ stores }: StoreSelectionPromptProps) {
	const { t } = useTranslation("menu");
	const navigate = useNavigate();

	return (
		<Empty>
			<EmptyHeader>
				<EmptyMedia variant="icon">
					<Store />
				</EmptyMedia>
				<EmptyTitle>{t("emptyStates.selectStoreTitle")}</EmptyTitle>
				<EmptyDescription>
					{t("emptyStates.selectStoreDescription")}
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<div className="flex flex-wrap justify-center gap-2">
					{stores.map((store) => (
						<Button
							key={store.id}
							variant="outline"
							onClick={() =>
								navigate({
									to: "/console/menu",
									search: { storeId: store.id },
								})
							}
						>
							{store.name}
						</Button>
					))}
				</div>
			</EmptyContent>
		</Empty>
	);
}
