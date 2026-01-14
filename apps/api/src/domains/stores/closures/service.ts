/**
 * Closures Service
 *
 * Service facade for store closure operations.
 */

import type { Database } from "@menuvo/db";
import { storeClosures, stores } from "@menuvo/db/schema";
import { eq } from "drizzle-orm";
import {
	ForbiddenError,
	NotFoundError,
	ValidationError,
} from "../../errors.js";
import type { IClosuresService } from "./interface.js";
import type { CreateClosureInput, UpdateClosureInput } from "./types.js";

/**
 * Closures service implementation
 */
export class ClosuresService implements IClosuresService {
	private readonly db: Database;

	constructor(db: Database) {
		this.db = db;
	}

	async list(storeId: string, merchantId: string) {
		// Verify store ownership
		const store = await this.db.query.stores.findFirst({
			where: eq(stores.id, storeId),
			columns: { id: true, merchantId: true },
		});

		if (!store || store.merchantId !== merchantId) {
			throw new ForbiddenError("You do not have access to this store");
		}

		const closures = await this.db.query.storeClosures.findMany({
			where: eq(storeClosures.storeId, storeId),
			orderBy: (c, { asc }) => [asc(c.startDate)],
		});

		return closures;
	}

	async getById(closureId: string, merchantId: string) {
		const closure = await this.db.query.storeClosures.findFirst({
			where: eq(storeClosures.id, closureId),
			with: {
				store: {
					columns: { merchantId: true },
				},
			},
		});

		if (!closure) {
			throw new NotFoundError("Closure not found");
		}

		if (closure.store.merchantId !== merchantId) {
			throw new ForbiddenError("You do not have access to this closure");
		}

		// Return closure without the nested store relation
		const { store: _, ...closureData } = closure;
		return closureData;
	}

	async create(input: CreateClosureInput) {
		// Check for overlapping closures
		const existingClosures = await this.db.query.storeClosures.findMany({
			where: eq(storeClosures.storeId, input.storeId),
		});

		const newStart = new Date(input.startDate);
		const newEnd = new Date(input.endDate);

		for (const existing of existingClosures) {
			const existStart = new Date(existing.startDate);
			const existEnd = new Date(existing.endDate);

			if (newStart <= existEnd && newEnd >= existStart) {
				throw new ValidationError(
					`This closure overlaps with an existing closure (${existing.startDate} to ${existing.endDate})`,
				);
			}
		}

		const [closure] = await this.db
			.insert(storeClosures)
			.values({
				storeId: input.storeId,
				startDate: input.startDate,
				endDate: input.endDate,
				reason: input.reason ?? null,
			})
			.returning();

		if (!closure) {
			throw new ValidationError("Failed to create closure");
		}

		return closure;
	}

	async update(
		closureId: string,
		merchantId: string,
		input: UpdateClosureInput,
	) {
		// Verify ownership
		const existingClosure = await this.db.query.storeClosures.findFirst({
			where: eq(storeClosures.id, closureId),
			with: {
				store: {
					columns: { merchantId: true },
				},
			},
		});

		if (!existingClosure) {
			throw new NotFoundError("Closure not found");
		}

		if (existingClosure.store.merchantId !== merchantId) {
			throw new ForbiddenError("You do not have access to this closure");
		}

		// Determine final dates for validation
		const finalStartDate = input.startDate ?? existingClosure.startDate;
		const finalEndDate = input.endDate ?? existingClosure.endDate;

		if (new Date(finalEndDate) < new Date(finalStartDate)) {
			throw new ValidationError("End date must be on or after start date");
		}

		// Check for overlapping closures (excluding current)
		const otherClosures = await this.db.query.storeClosures.findMany({
			where: eq(storeClosures.storeId, existingClosure.storeId),
		});

		const newStart = new Date(finalStartDate);
		const newEnd = new Date(finalEndDate);

		for (const other of otherClosures) {
			if (other.id === closureId) continue;

			const otherStart = new Date(other.startDate);
			const otherEnd = new Date(other.endDate);

			if (newStart <= otherEnd && newEnd >= otherStart) {
				throw new ValidationError(
					`This closure would overlap with an existing closure (${other.startDate} to ${other.endDate})`,
				);
			}
		}

		// Build update object
		const updateData: Record<string, unknown> = {};
		if (input.startDate !== undefined) updateData.startDate = input.startDate;
		if (input.endDate !== undefined) updateData.endDate = input.endDate;
		if (input.reason !== undefined) updateData.reason = input.reason ?? null;

		const [closure] = await this.db
			.update(storeClosures)
			.set(updateData)
			.where(eq(storeClosures.id, closureId))
			.returning();

		if (!closure) {
			throw new NotFoundError("Closure not found");
		}

		return closure;
	}

	async delete(closureId: string, merchantId: string): Promise<void> {
		// Verify ownership
		const closure = await this.db.query.storeClosures.findFirst({
			where: eq(storeClosures.id, closureId),
			with: {
				store: {
					columns: { merchantId: true },
				},
			},
		});

		if (!closure) {
			throw new NotFoundError("Closure not found");
		}

		if (closure.store.merchantId !== merchantId) {
			throw new ForbiddenError("You do not have access to this closure");
		}

		await this.db.delete(storeClosures).where(eq(storeClosures.id, closureId));
	}
}
