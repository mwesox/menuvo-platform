import { createServerFn } from "@tanstack/react-start";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { servicePointScans, servicePoints, stores } from "@/db/schema.ts";
import { recordScanSchema, scanStatsQuerySchema } from "../validation.ts";

/**
 * Record a QR code scan.
 * Called when a customer scans a service point QR code.
 */
export const recordScan = createServerFn({ method: "POST" })
	.inputValidator(recordScanSchema)
	.handler(async ({ data }) => {
		// Find store by slug
		const store = await db.query.stores.findFirst({
			where: eq(stores.slug, data.storeSlug),
		});
		if (!store) {
			return { success: false, reason: "store_not_found" };
		}

		// Find active service point by code
		const servicePoint = await db.query.servicePoints.findFirst({
			where: and(
				eq(servicePoints.storeId, store.id),
				eq(servicePoints.code, data.servicePointCode),
				eq(servicePoints.isActive, true),
			),
		});
		if (!servicePoint) {
			return { success: false, reason: "service_point_not_found" };
		}

		// Record the scan
		await db.insert(servicePointScans).values({
			servicePointId: servicePoint.id,
			storeId: store.id,
			userAgent: data.userAgent,
			referrer: data.referrer,
		});

		return { success: true, servicePointId: servicePoint.id };
	});

/**
 * Get scan statistics for a store.
 * Returns total scans, scans by service point, and daily breakdown.
 */
export const getStoreScanStats = createServerFn({ method: "GET" })
	.inputValidator(scanStatsQuerySchema)
	.handler(async ({ data }) => {
		const days = data.days ?? 30;
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		// Total scans in period
		const [totalResult] = await db
			.select({ count: count() })
			.from(servicePointScans)
			.where(
				and(
					eq(servicePointScans.storeId, data.storeId),
					gte(servicePointScans.scannedAt, startDate),
				),
			);

		// Scans grouped by service point
		const byServicePoint = await db
			.select({
				servicePointId: servicePointScans.servicePointId,
				name: servicePoints.name,
				code: servicePoints.code,
				type: servicePoints.type,
				count: count(),
			})
			.from(servicePointScans)
			.innerJoin(
				servicePoints,
				eq(servicePointScans.servicePointId, servicePoints.id),
			)
			.where(
				and(
					eq(servicePointScans.storeId, data.storeId),
					gte(servicePointScans.scannedAt, startDate),
				),
			)
			.groupBy(
				servicePointScans.servicePointId,
				servicePoints.name,
				servicePoints.code,
				servicePoints.type,
			)
			.orderBy(sql`count(*) desc`);

		// Daily breakdown
		const daily = await db
			.select({
				date: sql<string>`DATE(${servicePointScans.scannedAt})`.as("date"),
				count: count(),
			})
			.from(servicePointScans)
			.where(
				and(
					eq(servicePointScans.storeId, data.storeId),
					gte(servicePointScans.scannedAt, startDate),
				),
			)
			.groupBy(sql`DATE(${servicePointScans.scannedAt})`)
			.orderBy(sql`DATE(${servicePointScans.scannedAt})`);

		return {
			totalScans: totalResult?.count ?? 0,
			byServicePoint,
			daily,
			period: { start: startDate.toISOString(), end: new Date().toISOString() },
		};
	});

/**
 * Get scan statistics for a single service point.
 */
export const getServicePointScanStats = createServerFn({ method: "GET" })
	.inputValidator(
		z.object({
			servicePointId: z.number().int().positive(),
			days: z.number().int().min(1).max(365).default(30),
		}),
	)
	.handler(async ({ data }) => {
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - data.days);

		const [totalResult] = await db
			.select({ count: count() })
			.from(servicePointScans)
			.where(
				and(
					eq(servicePointScans.servicePointId, data.servicePointId),
					gte(servicePointScans.scannedAt, startDate),
				),
			);

		// Daily breakdown for this service point
		const daily = await db
			.select({
				date: sql<string>`DATE(${servicePointScans.scannedAt})`.as("date"),
				count: count(),
			})
			.from(servicePointScans)
			.where(
				and(
					eq(servicePointScans.servicePointId, data.servicePointId),
					gte(servicePointScans.scannedAt, startDate),
				),
			)
			.groupBy(sql`DATE(${servicePointScans.scannedAt})`)
			.orderBy(sql`DATE(${servicePointScans.scannedAt})`);

		return {
			totalScans: totalResult?.count ?? 0,
			daily,
			period: { start: startDate.toISOString(), end: new Date().toISOString() },
		};
	});
