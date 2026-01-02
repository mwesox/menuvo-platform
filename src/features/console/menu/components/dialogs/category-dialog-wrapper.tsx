import type { Category } from "@/db/schema";
import { CategoryDialog } from "@/features/console/menu/components/category-dialog";
import { useDisplayLanguage } from "@/features/console/menu/contexts/display-language-context";
import {
	useCreateCategory,
	useUpdateCategory,
} from "@/features/console/menu/queries";
import { formToTranslations } from "@/features/console/menu/validation";

interface CategoryDialogWrapperProps {
	storeId: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	category: Category | null;
}

export function CategoryDialogWrapper({
	storeId,
	open,
	onOpenChange,
	category,
}: CategoryDialogWrapperProps) {
	const language = useDisplayLanguage();
	const createMutation = useCreateCategory(storeId);
	const updateMutation = useUpdateCategory(storeId);

	const handleSave = async (data: { name: string; description?: string }) => {
		const translations = formToTranslations(
			{ name: data.name, description: data.description ?? "" },
			language,
			category?.translations ?? undefined,
		);

		if (category) {
			await updateMutation.mutateAsync({
				categoryId: category.id,
				translations,
			});
		} else {
			await createMutation.mutateAsync({ translations });
		}
	};

	return (
		<CategoryDialog
			open={open}
			onOpenChange={onOpenChange}
			category={category}
			onSave={handleSave}
		/>
	);
}
