"use server";

import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { storeClosures } from "@/db/schema.ts";
import {
	createStoreClosureSchema,
	deleteStoreClosureSchema,
	getStoreClosuresSchema,
	updateStoreClosureSchema,
} from "../closures-validation.ts";

export const getStoreClosures = createServerFn({ method: "GET" })
	.inputValidator(getStoreClosuresSchema)
	.handler(async ({ data }) => {
		const closures = await db.query.storeClosures.findMany({
			where: eq(storeClosures.storeId, data.storeId),
			orderBy: (c, { asc }) => [asc(c.startDate)],
		});
		return closures;
	});

export const createStoreClosure = createServerFn({ method: "POST" })
	.inputValidator(createStoreClosureSchema)
	.handler(async ({ data }) => {
		const [closure] = await db
			.insert(storeClosures)
			.values({
				storeId: data.storeId,
				startDate: data.startDate,
				endDate: data.endDate,
				reason: data.reason || null,
			})
			.returning();

		return closure;
	});

export const updateStoreClosure = createServerFn({ method: "POST" })
	.inputValidator(updateStoreClosureSchema)
	.handler(async ({ data }) => {
		const [closure] = await db
			.update(storeClosures)
			.set({
				startDate: data.startDate,
				endDate: data.endDate,
				reason: data.reason || null,
			})
			.where(eq(storeClosures.id, data.id))
			.returning();

		if (!closure) {
			throw new Error("Closure not found");
		}

		return closure;
	});

export const deleteStoreClosure = createServerFn({ method: "POST" })
	.inputValidator(deleteStoreClosureSchema)
	.handler(async ({ data }) => {
		await db.delete(storeClosures).where(eq(storeClosures.id, data.id));
		return { success: true };
	});
