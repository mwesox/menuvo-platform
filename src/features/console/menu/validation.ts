import { z } from "zod";

// Categories
export const createCategorySchema = z.object({
	storeId: z.number().int().positive(),
	name: z
		.string()
		.min(2, "Category name must be at least 2 characters")
		.max(100, "Category name must be less than 100 characters"),
	description: z.string().optional(),
	displayOrder: z.number().int().min(0).optional(),
});

export const updateCategorySchema = createCategorySchema
	.omit({ storeId: true })
	.partial();

// Client-side category form schema
export const categoryFormSchema = z.object({
	name: z
		.string()
		.min(2, "Category name must be at least 2 characters")
		.max(100, "Category name must be less than 100 characters"),
	description: z.string(),
});
export type CategoryFormInput = z.infer<typeof categoryFormSchema>;

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// Items
export const createItemSchema = z.object({
	categoryId: z.number().int().positive(),
	storeId: z.number().int().positive(),
	name: z
		.string()
		.min(2, "Item name must be at least 2 characters")
		.max(100, "Item name must be less than 100 characters"),
	description: z.string().optional(),
	price: z.number().int().min(0, "Price must be positive"), // Price in cents
	imageUrl: z.string().url().optional().or(z.literal("")),
	allergens: z.array(z.string()).default([]),
	displayOrder: z.number().int().min(0).default(0),
});

export const updateItemSchema = createItemSchema
	.omit({ categoryId: true, storeId: true })
	.partial();

// Client-side item form schema (with price as string for input handling)
export const itemFormSchema = z.object({
	name: z
		.string()
		.min(2, "Item name must be at least 2 characters")
		.max(100, "Item name must be less than 100 characters"),
	description: z.string(),
	price: z.string().min(1, "Price is required"),
	imageUrl: z.string(),
	allergens: z.array(z.string()),
});
export type ItemFormInput = z.infer<typeof itemFormSchema>;

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;

// Common allergens
export const allergensList = [
	{ value: "gluten", label: "Gluten" },
	{ value: "dairy", label: "Dairy" },
	{ value: "eggs", label: "Eggs" },
	{ value: "nuts", label: "Nuts" },
	{ value: "peanuts", label: "Peanuts" },
	{ value: "soy", label: "Soy" },
	{ value: "fish", label: "Fish" },
	{ value: "shellfish", label: "Shellfish" },
	{ value: "sesame", label: "Sesame" },
	{ value: "celery", label: "Celery" },
	{ value: "mustard", label: "Mustard" },
	{ value: "lupin", label: "Lupin" },
	{ value: "molluscs", label: "Molluscs" },
	{ value: "sulphites", label: "Sulphites" },
] as const;
