import type {
	PublicCategory,
	PublicOptionChoice,
	PublicOptionGroup,
} from "@menuvo/trpc/schemas";
import { useCallback, useState } from "react";

type OptionGroupWithChoices = PublicOptionGroup & {
	choices: PublicOptionChoice[];
};
type DeleteType = "category" | "item" | "optionGroup";

export function useMenuPageState() {
	// Category dialog
	const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
	const [editingCategory, setEditingCategory] = useState<PublicCategory | null>(
		null,
	);

	// Option group dialog
	const [optionGroupDialogOpen, setOptionGroupDialogOpen] = useState(false);
	const [editingOptionGroup, setEditingOptionGroup] =
		useState<OptionGroupWithChoices | null>(null);

	// Delete confirmation
	const [deleteType, setDeleteType] = useState<DeleteType | null>(null);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	return {
		categoryDialog: {
			open: categoryDialogOpen,
			editing: editingCategory,
			openCreate: useCallback(() => {
				setEditingCategory(null);
				setCategoryDialogOpen(true);
			}, []),
			openEdit: useCallback((category: PublicCategory) => {
				setEditingCategory(category);
				setCategoryDialogOpen(true);
			}, []),
			close: useCallback(() => {
				setCategoryDialogOpen(false);
				setEditingCategory(null);
			}, []),
			setOpen: setCategoryDialogOpen,
		},
		optionGroupDialog: {
			open: optionGroupDialogOpen,
			editing: editingOptionGroup,
			openCreate: useCallback(() => {
				setEditingOptionGroup(null);
				setOptionGroupDialogOpen(true);
			}, []),
			openEdit: useCallback((optionGroup: OptionGroupWithChoices) => {
				setEditingOptionGroup(optionGroup);
				setOptionGroupDialogOpen(true);
			}, []),
			close: useCallback(() => {
				setOptionGroupDialogOpen(false);
				setEditingOptionGroup(null);
			}, []),
			setOpen: setOptionGroupDialogOpen,
		},
		deleteConfirmation: {
			type: deleteType,
			id: deleteId,
			open: useCallback((type: DeleteType, id: string) => {
				setDeleteType(type);
				setDeleteId(id);
			}, []),
			close: useCallback(() => {
				setDeleteType(null);
				setDeleteId(null);
			}, []),
		},
	};
}

export type MenuPageState = ReturnType<typeof useMenuPageState>;
