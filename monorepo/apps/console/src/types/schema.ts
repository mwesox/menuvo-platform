/**
 * Local type definitions for schema types
 *
 * These mirror the types from @menuvo/db/schema but are defined locally
 * since the console app is a SPA and doesn't have direct database access.
 */

//FIXME bad design. must be solved differently! restructure it.

// Translation types
export type EntityTranslations = Record<
	string,
	{
		name?: string;
		description?: string;
	}
>;

export type ChoiceTranslations = Record<
	string,
	{
		name?: string;
	}
>;

// Option group type
export type OptionGroupType =
	| "single_select"
	| "multi_select"
	| "quantity_select";

// Order status type
export type OrderStatus =
	| "pending"
	| "confirmed"
	| "preparing"
	| "ready"
	| "completed"
	| "cancelled";

// Image related types
export interface Image {
	id: string;
	url: string;
	thumbnailUrl?: string | null;
	altText?: string | null;
	width?: number | null;
	height?: number | null;
	mimeType?: string | null;
	size?: number | null;
	createdAt: Date;
	updatedAt: Date;
}
