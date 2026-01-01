import type { Category } from "@/db/schema";
import { CategoryDialog } from "@/features/console/menu/components/category-dialog";
import {
	useCreateCategory,
	useUpdateCategory,
} from "@/features/console/menu/queries";

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
	const createMutation = useCreateCategory(storeId);
	const updateMutation = useUpdateCategory(storeId);

	const handleSave = async (data: { name: string; description?: string }) => {
		if (category) {
			await updateMutation.mutateAsync({
				categoryId: category.id,
				...data,
			});
		} else {
			await createMutation.mutateAsync(data);
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
