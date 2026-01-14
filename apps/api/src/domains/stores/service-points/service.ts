/**
 * Service Points Service
 *
 * Service facade for service point operations.
 */

import type { Database } from "@menuvo/db";
import { servicePoints, stores } from "@menuvo/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
	ForbiddenError,
	NotFoundError,
	ValidationError,
} from "../../errors.js";
import type {
	GetByShortCodeResult,
	IServicePointsService,
} from "./interface.js";
import type {
	BatchCreateServicePointsInput,
	CreateServicePointInput,
	UpdateServicePointInput,
} from "./types.js";

/**
 * Service points service implementation
 */
export class ServicePointsService implements IServicePointsService {
	private readonly db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	/**
	 * Generate a unique 8-character short code for QR URLs
	 */
	private async generateUniqueShortCode(): Promise<string> {
		const maxAttempts = 5;
		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			const shortCode = nanoid(8).toLowerCase();
			const existing = await this.db.query.servicePoints.findFirst({
				where: eq(servicePoints.shortCode, shortCode),
				columns: { id: true },
			});
			if (!existing) {
				return shortCode;
			}
		}
		throw new ValidationError("Failed to generate unique short code");
	}

	/**
	 * Generate a URL-safe code from prefix and number
	 */
	private generateCode(prefix: string, number: number): string {
		return `${prefix.toLowerCase().replace(/\s+/g, "-")}-${number}`;
	}

	/**
	 * Verify store ownership by merchantId
	 */
	private async requireStoreOwnership(
		storeId: string,
		merchantId: string,
	): Promise<{ id: string; merchantId: string }> {
		const store = await this.db.query.stores.findFirst({
			where: eq(stores.id, storeId),
			columns: { id: true, merchantId: true },
		});
		if (!store || store.merchantId !== merchantId) {
			throw new ForbiddenError("Store not found or access denied");
		}
		return store;
	}

	/**
	 * Verify service point ownership by merchantId
	 */
	private async requireServicePointOwnership(
		servicePointId: string,
		merchantId: string,
	): Promise<void> {
		const servicePoint = await this.db.query.servicePoints.findFirst({
			where: eq(servicePoints.id, servicePointId),
			with: { store: { columns: { merchantId: true } } },
		});
		if (!servicePoint || servicePoint.store.merchantId !== merchantId) {
			throw new ForbiddenError("Service point not found or access denied");
		}
	}

	async list(storeId: string, merchantId: string) {
		await this.requireStoreOwnership(storeId, merchantId);
		return this.db.query.servicePoints.findMany({
			where: eq(servicePoints.storeId, storeId),
			orderBy: [asc(servicePoints.displayOrder), asc(servicePoints.name)],
		});
	}

	async getById(servicePointId: string, merchantId: string) {
		await this.requireServicePointOwnership(servicePointId, merchantId);
		const servicePoint = await this.db.query.servicePoints.findFirst({
			where: eq(servicePoints.id, servicePointId),
		});
		if (!servicePoint) {
			throw new NotFoundError("Service point not found");
		}
		return servicePoint;
	}

	async getByCode(storeSlug: string, code: string) {
		const store = await this.db.query.stores.findFirst({
			where: eq(stores.slug, storeSlug),
		});
		if (!store) return null;

		const result = await this.db.query.servicePoints.findFirst({
			where: and(
				eq(servicePoints.storeId, store.id),
				eq(servicePoints.code, code),
				eq(servicePoints.isActive, true),
			),
		});
		return result ?? null;
	}

	async validateForStore(
		servicePointId: string,
		storeId: string,
	): Promise<boolean> {
		const servicePoint = await this.db.query.servicePoints.findFirst({
			where: and(
				eq(servicePoints.id, servicePointId),
				eq(servicePoints.storeId, storeId),
				eq(servicePoints.isActive, true),
			),
			columns: { id: true },
		});
		return !!servicePoint;
	}

	async getByShortCode(shortCode: string): Promise<GetByShortCodeResult> {
		const servicePoint = await this.db.query.servicePoints.findFirst({
			where: eq(servicePoints.shortCode, shortCode),
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
			return { status: "not_found" };
		}

		if (!servicePoint.store.isActive) {
			return { status: "store_inactive" };
		}

		if (!servicePoint.isActive) {
			return { status: "service_point_inactive" };
		}

		return {
			status: "active",
			storeSlug: servicePoint.store.slug,
			servicePointCode: servicePoint.code,
		};
	}

	async getZones(storeId: string, merchantId: string) {
		await this.requireStoreOwnership(storeId, merchantId);
		const points = await this.db.query.servicePoints.findMany({
			where: eq(servicePoints.storeId, storeId),
			columns: { zone: true },
		});
		const zones = [
			...new Set(points.map((p) => p.zone).filter(Boolean) as string[]),
		];
		return zones.sort();
	}

	async create(input: CreateServicePointInput, merchantId: string) {
		await this.requireStoreOwnership(input.storeId, merchantId);

		// Check for duplicate code within store
		const existing = await this.db.query.servicePoints.findFirst({
			where: and(
				eq(servicePoints.storeId, input.storeId),
				eq(servicePoints.code, input.code),
			),
		});
		if (existing) {
			throw new ValidationError(
				"A service point with this code already exists",
			);
		}

		// Calculate next display order if not provided
		let displayOrder = input.displayOrder ?? 0;
		if (displayOrder === 0) {
			const lastPoint = await this.db.query.servicePoints.findFirst({
				where: eq(servicePoints.storeId, input.storeId),
				orderBy: (sp, { desc }) => [desc(sp.displayOrder)],
			});
			displayOrder = (lastPoint?.displayOrder ?? -1) + 1;
		}

		// Generate unique short code for QR URLs
		const shortCode = await this.generateUniqueShortCode();

		const [newServicePoint] = await this.db
			.insert(servicePoints)
			.values({
				storeId: input.storeId,
				code: input.code,
				shortCode,
				name: input.name,
				displayOrder,
				description: input.description ?? null,
				zone: input.zone ?? null,
				attributes:
					(input.attributes as Record<
						string,
						string | number | boolean
					> | null) ?? null,
			})
			.returning();

		if (!newServicePoint) {
			throw new ValidationError("Failed to create service point");
		}

		return newServicePoint;
	}

	async update(
		servicePointId: string,
		merchantId: string,
		input: UpdateServicePointInput,
	) {
		await this.requireServicePointOwnership(servicePointId, merchantId);

		// If code is being updated, check for duplicates
		if (input.code) {
			const current = await this.db.query.servicePoints.findFirst({
				where: eq(servicePoints.id, servicePointId),
			});
			if (!current) {
				throw new NotFoundError("Service point not found");
			}

			const existing = await this.db.query.servicePoints.findFirst({
				where: and(
					eq(servicePoints.storeId, current.storeId),
					eq(servicePoints.code, input.code),
				),
			});
			if (existing && existing.id !== servicePointId) {
				throw new ValidationError(
					"A service point with this code already exists",
				);
			}
		}

		const updateData: Record<string, unknown> = {};
		if (input.code !== undefined) updateData.code = input.code;
		if (input.name !== undefined) updateData.name = input.name;
		if (input.zone !== undefined) updateData.zone = input.zone || null;
		if (input.description !== undefined)
			updateData.description = input.description || null;
		if (input.attributes !== undefined) {
			updateData.attributes = input.attributes as Record<
				string,
				string | number | boolean
			> | null;
		}
		if (input.displayOrder !== undefined)
			updateData.displayOrder = input.displayOrder;

		const [updated] = await this.db
			.update(servicePoints)
			.set(updateData)
			.where(eq(servicePoints.id, servicePointId))
			.returning();

		if (!updated) {
			throw new NotFoundError("Service point not found");
		}

		return updated;
	}

	async toggleActive(
		servicePointId: string,
		merchantId: string,
		isActive: boolean,
	) {
		await this.requireServicePointOwnership(servicePointId, merchantId);

		const [updated] = await this.db
			.update(servicePoints)
			.set({ isActive })
			.where(eq(servicePoints.id, servicePointId))
			.returning();

		if (!updated) {
			throw new NotFoundError("Service point not found");
		}

		return updated;
	}

	async toggleZoneActive(
		storeId: string,
		merchantId: string,
		zone: string,
		isActive: boolean,
	) {
		await this.requireStoreOwnership(storeId, merchantId);

		const result = await this.db
			.update(servicePoints)
			.set({ isActive })
			.where(
				and(eq(servicePoints.storeId, storeId), eq(servicePoints.zone, zone)),
			)
			.returning();

		return { count: result.length, isActive };
	}

	async delete(servicePointId: string, merchantId: string): Promise<void> {
		await this.requireServicePointOwnership(servicePointId, merchantId);
		await this.db
			.delete(servicePoints)
			.where(eq(servicePoints.id, servicePointId));
	}

	async batchCreate(input: BatchCreateServicePointsInput, merchantId: string) {
		await this.requireStoreOwnership(input.storeId, merchantId);
		const { prefix, startNumber, count, zone } = input;

		// Generate all names and codes
		const pointsToCreate = [];
		for (let i = 0; i < count; i++) {
			pointsToCreate.push({
				name: `${prefix} ${startNumber + i}`,
				code: this.generateCode(prefix, startNumber + i),
			});
		}

		// Check for existing codes
		const existingPoints = await this.db.query.servicePoints.findMany({
			where: eq(servicePoints.storeId, input.storeId),
			columns: { code: true },
		});
		const existingCodes = new Set(existingPoints.map((p) => p.code));

		const conflicts = pointsToCreate.filter((p) => existingCodes.has(p.code));
		if (conflicts.length > 0) {
			throw new ValidationError(
				`Service points with these codes already exist: ${conflicts.map((c) => c.code).join(", ")}`,
			);
		}

		// Calculate starting display order
		const lastPoint = await this.db.query.servicePoints.findFirst({
			where: eq(servicePoints.storeId, input.storeId),
			orderBy: (sp, { desc }) => [desc(sp.displayOrder)],
		});
		const startDisplayOrder = (lastPoint?.displayOrder ?? -1) + 1;

		// Generate unique short codes
		const shortCodes = await Promise.all(
			pointsToCreate.map(() => this.generateUniqueShortCode()),
		);

		// Bulk insert
		const values = pointsToCreate.map((p, index) => ({
			storeId: input.storeId,
			code: p.code,
			// biome-ignore lint/style/noNonNullAssertion: Array lengths match
			shortCode: shortCodes[index]!,
			name: p.name,
			zone: zone ?? null,
			displayOrder: startDisplayOrder + index,
			isActive: true,
		}));

		const created = await this.db
			.insert(servicePoints)
			.values(values)
			.returning();

		return created;
	}
}
