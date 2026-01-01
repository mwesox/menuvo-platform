"use client";

import { useEffect } from "react";
import { recordScan } from "@/features/console/service-points";
import { SERVICE_POINT_STORAGE_KEY } from "../../constants";

interface Store {
	slug: string;
}

/**
 * Hook for tracking QR code scans and storing service point information.
 * Records the scan to the server and stores the service point in localStorage
 * for order attribution.
 */
export function useQRTracking(
	store: Store | undefined,
	servicePointCode: string | undefined,
): void {
	useEffect(() => {
		if (!servicePointCode || !store) return;

		// Store service point in localStorage for order attribution
		localStorage.setItem(
			SERVICE_POINT_STORAGE_KEY,
			JSON.stringify({
				storeSlug: store.slug,
				code: servicePointCode,
				timestamp: Date.now(),
			}),
		);

		// Record the scan (fire and forget)
		recordScan({
			data: {
				storeSlug: store.slug,
				servicePointCode,
				userAgent:
					typeof navigator !== "undefined" ? navigator.userAgent : undefined,
				referrer:
					typeof document !== "undefined" ? document.referrer : undefined,
			},
		}).catch(() => {
			// Silently ignore scan recording failures
			// In production, this could log to an error tracking service
		});
	}, [servicePointCode, store]);
}
