import { createServerFn } from "@tanstack/react-start";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { servicePoints, stores } from "@/db/schema.ts";
import {
	createServicePointSchema,
	updateServicePointSchema,
} from "../validation.ts";

/**
 * Get all service points for a store.
 */
export const getServicePoints = createServerFn({ method: "GET" })
	.inputValidator(z.object({ storeId: z.number() }))
	.handler(async ({ data }) => {
		return db.query.servicePoints.findMany({
			where: eq(servicePoints.storeId, data.storeId),
			orderBy: [asc(servicePoints.displayOrder), asc(servicePoints.name)],
		});
	});

/**
 * Get a single service point by ID.
 */
export const getServicePoint = createServerFn({ method: "GET" })
	.inputValidator(z.object({ id: z.number() }))
	.handler(async ({ data }) => {
		const servicePoint = await db.query.servicePoints.findFirst({
			where: eq(servicePoints.id, data.id),
		});
		if (!servicePoint) {
			throw new Error("Service point not found");
		}
		return servicePoint;
	});

/**
 * Get service point by store slug and code.
 * Used for public access via QR code URLs.
 */
export const getServicePointByCode = createServerFn({ method: "GET" })
	.inputValidator(z.object({ storeSlug: z.string(), code: z.string() }))
	.handler(async ({ data }) => {
		const store = await db.query.stores.findFirst({
			where: eq(stores.slug, data.storeSlug),
		});
		if (!store) return null;

		return db.query.servicePoints.findFirst({
			where: and(
				eq(servicePoints.storeId, store.id),
				eq(servicePoints.code, data.code),
				eq(servicePoints.isActive, true),
			),
		});
	});

/**
 * Create a new service point.
 */
export const createServicePoint = createServerFn({ method: "POST" })
	.inputValidator(createServicePointSchema)
	.handler(async ({ data }) => {
		// Check for duplicate code within store
		const existing = await db.query.servicePoints.findFirst({
			where: and(
				eq(servicePoints.storeId, data.storeId),
				eq(servicePoints.code, data.code),
			),
		});
		if (existing) {
			throw new Error("A service point with this code already exists");
		}

		// Calculate next display order if not provided
		let displayOrder = data.displayOrder ?? 0;
		if (displayOrder === 0) {
			const lastPoint = await db.query.servicePoints.findFirst({
				where: eq(servicePoints.storeId, data.storeId),
				orderBy: (sp, { desc }) => [desc(sp.displayOrder)],
			});
			displayOrder = (lastPoint?.displayOrder ?? -1) + 1;
		}

		const [newServicePoint] = await db
			.insert(servicePoints)
			.values({
				storeId: data.storeId,
				code: data.code,
				name: data.name,
				displayOrder,
				description: data.description ?? null,
				type: data.type ?? null,
				attributes:
					(data.attributes as Record<
						string,
						string | number | boolean
					> | null) ?? null,
			})
			.returning();

		return newServicePoint;
	});

/**
 * Update an existing service point.
 */
export const updateServicePoint = createServerFn({ method: "POST" })
	.inputValidator(updateServicePointSchema.extend({ id: z.number() }))
	.handler(async ({ data }) => {
		const { id, ...updates } = data;

		// If code is being updated, check for duplicates
		if (updates.code) {
			const current = await db.query.servicePoints.findFirst({
				where: eq(servicePoints.id, id),
			});
			if (!current) {
				throw new Error("Service point not found");
			}

			const existing = await db.query.servicePoints.findFirst({
				where: and(
					eq(servicePoints.storeId, current.storeId),
					eq(servicePoints.code, updates.code),
				),
			});
			if (existing && existing.id !== id) {
				throw new Error("A service point with this code already exists");
			}
		}

		// Build update object explicitly
		const updateData: Partial<{
			code: string;
			name: string;
			type: string | null;
			description: string | null;
			attributes: Record<string, string | number | boolean> | null;
			displayOrder: number;
		}> = {};

		if (updates.code !== undefined) updateData.code = updates.code;
		if (updates.name !== undefined) updateData.name = updates.name;
		if (updates.type !== undefined) updateData.type = updates.type || null;
		if (updates.description !== undefined)
			updateData.description = updates.description || null;
		if (updates.attributes !== undefined) {
			updateData.attributes = updates.attributes as Record<
				string,
				string | number | boolean
			> | null;
		}
		if (updates.displayOrder !== undefined)
			updateData.displayOrder = updates.displayOrder;

		const [updated] = await db
			.update(servicePoints)
			.set(updateData)
			.where(eq(servicePoints.id, id))
			.returning();

		if (!updated) {
			throw new Error("Service point not found");
		}

		return updated;
	});

/**
 * Toggle service point active status.
 */
export const toggleServicePointActive = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.number(), isActive: z.boolean() }))
	.handler(async ({ data }) => {
		const [updated] = await db
			.update(servicePoints)
			.set({ isActive: data.isActive })
			.where(eq(servicePoints.id, data.id))
			.returning();

		if (!updated) {
			throw new Error("Service point not found");
		}

		return updated;
	});

/**
 * Delete a service point.
 */
export const deleteServicePoint = createServerFn({ method: "POST" })
	.inputValidator(z.object({ id: z.number() }))
	.handler(async ({ data }) => {
		await db.delete(servicePoints).where(eq(servicePoints.id, data.id));
		return { success: true };
	});

/**
 * Get distinct types used in a store's service points.
 * Useful for suggesting types when creating new service points.
 */
export const getServicePointTypes = createServerFn({ method: "GET" })
	.inputValidator(z.object({ storeId: z.number() }))
	.handler(async ({ data }) => {
		const points = await db.query.servicePoints.findMany({
			where: eq(servicePoints.storeId, data.storeId),
			columns: { type: true },
		});
		const types = [
			...new Set(points.map((p) => p.type).filter(Boolean) as string[]),
		];
		return types.sort();
	});
