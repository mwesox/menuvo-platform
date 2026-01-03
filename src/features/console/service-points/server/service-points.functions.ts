import { createServerFn } from "@tanstack/react-start";
import { and, asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/db";
import { servicePoints, stores } from "@/db/schema.ts";
import {
	batchCreateSchema,
	createServicePointSchema,
	toggleZoneSchema,
	updateServicePointSchema,
} from "../schemas.ts";

/**
 * Generate a unique 8-character short code for QR URLs.
 * Uses lowercase alphanumeric characters for URL safety.
 */
async function generateUniqueShortCode(): Promise<string> {
	const maxAttempts = 5;
	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		// Generate 8-char lowercase alphanumeric code
		const shortCode = nanoid(8).toLowerCase();

		// Check for uniqueness
		const existing = await db.query.servicePoints.findFirst({
			where: eq(servicePoints.shortCode, shortCode),
			columns: { id: true },
		});

		if (!existing) {
			return shortCode;
		}
	}
	throw new Error("Failed to generate unique short code");
}

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
 * Get service point by short code with store info.
 * Used for QR code redirect route.
 */
export const getServicePointByShortCode = createServerFn({ method: "GET" })
	.inputValidator(z.object({ shortCode: z.string() }))
	.handler(async ({ data }) => {
		const servicePoint = await db.query.servicePoints.findFirst({
			where: eq(servicePoints.shortCode, data.shortCode),
			with: {
				store: {
					columns: {
						slug: true,
						isActive: true,
					},
				},
			},
		});

		if (!servicePoint) {
			return { status: "not_found" as const };
		}

		if (!servicePoint.store.isActive) {
			return { status: "store_inactive" as const };
		}

		if (!servicePoint.isActive) {
			return { status: "service_point_inactive" as const };
		}

		return {
			status: "active" as const,
			storeSlug: servicePoint.store.slug,
			servicePointCode: servicePoint.code,
		};
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

		// Generate unique short code for QR URLs
		const shortCode = await generateUniqueShortCode();

		const [newServicePoint] = await db
			.insert(servicePoints)
			.values({
				storeId: data.storeId,
				code: data.code,
				shortCode,
				name: data.name,
				displayOrder,
				description: data.description ?? null,
				zone: data.zone ?? null,
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
			zone: string | null;
			description: string | null;
			attributes: Record<string, string | number | boolean> | null;
			displayOrder: number;
		}> = {};

		if (updates.code !== undefined) updateData.code = updates.code;
		if (updates.name !== undefined) updateData.name = updates.name;
		if (updates.zone !== undefined) updateData.zone = updates.zone || null;
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
 * Get distinct zones used in a store's service points.
 * Useful for suggesting zones when creating new service points.
 */
export const getServicePointZones = createServerFn({ method: "GET" })
	.inputValidator(z.object({ storeId: z.number() }))
	.handler(async ({ data }) => {
		const points = await db.query.servicePoints.findMany({
			where: eq(servicePoints.storeId, data.storeId),
			columns: { zone: true },
		});
		const zones = [
			...new Set(points.map((p) => p.zone).filter(Boolean) as string[]),
		];
		return zones.sort();
	});

/**
 * Toggle all service points in a zone active/inactive.
 */
export const toggleZoneActive = createServerFn({ method: "POST" })
	.inputValidator(toggleZoneSchema)
	.handler(async ({ data }) => {
		const result = await db
			.update(servicePoints)
			.set({ isActive: data.isActive })
			.where(
				and(
					eq(servicePoints.storeId, data.storeId),
					eq(servicePoints.zone, data.zone),
				),
			)
			.returning();

		return { count: result.length, isActive: data.isActive };
	});

/**
 * Generate a kebab-case code from a name.
 */
function generateCode(prefix: string, number: number): string {
	return `${prefix.toLowerCase().replace(/\s+/g, "-")}-${number}`;
}

/**
 * Batch create service points with sequential names/codes.
 */
export const batchCreateServicePoints = createServerFn({ method: "POST" })
	.inputValidator(batchCreateSchema)
	.handler(async ({ data }) => {
		const { storeId, prefix, startNumber, endNumber, zone } = data;

		// Generate all names and codes
		const pointsToCreate = [];
		for (let i = startNumber; i <= endNumber; i++) {
			pointsToCreate.push({
				name: `${prefix} ${i}`,
				code: generateCode(prefix, i),
			});
		}

		// Check for existing codes
		const existingPoints = await db.query.servicePoints.findMany({
			where: eq(servicePoints.storeId, storeId),
			columns: { code: true },
		});
		const existingCodes = new Set(existingPoints.map((p) => p.code));

		const conflicts = pointsToCreate.filter((p) => existingCodes.has(p.code));
		if (conflicts.length > 0) {
			throw new Error(
				`Service points with these codes already exist: ${conflicts.map((c) => c.code).join(", ")}`,
			);
		}

		// Calculate starting display order
		const lastPoint = await db.query.servicePoints.findFirst({
			where: eq(servicePoints.storeId, storeId),
			orderBy: (sp, { desc }) => [desc(sp.displayOrder)],
		});
		const startDisplayOrder = (lastPoint?.displayOrder ?? -1) + 1;

		// Generate unique short codes for all service points
		const shortCodes = await Promise.all(
			pointsToCreate.map(() => generateUniqueShortCode()),
		);

		// Bulk insert
		const values = pointsToCreate.map((p, index) => ({
			storeId,
			code: p.code,
			shortCode: shortCodes[index],
			name: p.name,
			zone: zone ?? null,
			displayOrder: startDisplayOrder + index,
		}));

		const created = await db.insert(servicePoints).values(values).returning();

		return created;
	});
