import { createFileRoute } from "@tanstack/react-router";
// NOTE: Server-only imports are dynamically imported inside handler
// to prevent bundling in client via routeTree.gen.ts
import {
	type AllowedFileType,
	allowedFileTypes,
} from "@/features/console/menu-import/schemas";

/** Maximum file size in bytes (5MB) */
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/** Maximum imports allowed per store per hour */
const MAX_IMPORTS_PER_HOUR = 10;

/**
 * Menu Import Upload API Route
 *
 * Accepts FormData with file data for menu import.
 *
 * FormData fields:
 * - file: File (menu file - xlsx, csv, json, md, txt)
 * - storeId: string (UUID)
 *
 * Security:
 * - File size limit: 5MB
 * - Rate limit: 10 imports per store per hour
 */
export const Route = createFileRoute("/api/menu-import/upload")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				// Dynamic imports to prevent client bundling
				const [
					{ and, count, eq, gt },
					{ db },
					{ menuImportJobs },
					{ createImportJob },
					{ menuImportLogger },
					{ uploadFile },
				] = await Promise.all([
					import("drizzle-orm"),
					import("@/db"),
					import("@/db/schema"),
					import("@/features/console/menu-import/server/import.helpers"),
					import("@/lib/logger"),
					import("@/lib/storage/files-client"),
				]);

				const formData = await request.formData();

				const file = formData.get("file") as File | null;
				const storeIdStr = formData.get("storeId") as string | null;

				// Validate required fields
				if (!file) {
					return Response.json({ error: "Missing file" }, { status: 400 });
				}

				if (!storeIdStr) {
					return Response.json({ error: "Missing storeId" }, { status: 400 });
				}

				const storeId = storeIdStr;

				// Security: Validate file size
				if (file.size > MAX_FILE_SIZE) {
					menuImportLogger.warn(
						{ storeId, fileSize: file.size },
						"Menu import rejected: file too large",
					);
					return Response.json(
						{ error: "File too large. Maximum size is 5MB." },
						{ status: 400 },
					);
				}

				// Validate file type
				const ext = file.name.split(".").pop()?.toLowerCase();
				if (!ext || !allowedFileTypes.includes(ext as AllowedFileType)) {
					return Response.json(
						{
							error: `Invalid file type. Allowed: ${allowedFileTypes.join(", ")}`,
						},
						{ status: 400 },
					);
				}

				// Security: Rate limiting - check recent imports for this store
				const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
				const [recentImports] = await db
					.select({ count: count() })
					.from(menuImportJobs)
					.where(
						and(
							eq(menuImportJobs.storeId, storeId),
							gt(menuImportJobs.createdAt, oneHourAgo),
						),
					);

				if (recentImports.count >= MAX_IMPORTS_PER_HOUR) {
					menuImportLogger.warn(
						{ storeId, recentCount: recentImports.count },
						"Menu import rejected: rate limit exceeded",
					);
					return Response.json(
						{
							error:
								"Too many imports. Please try again later (max 10 per hour).",
						},
						{ status: 429 },
					);
				}

				try {
					// Get file data
					const arrayBuffer = await file.arrayBuffer();
					const buffer = Buffer.from(arrayBuffer);

					// Generate unique key and upload to internal files bucket
					const jobUuid = crypto.randomUUID();
					const fileKey = `imports/${storeId}/${jobUuid}.${ext}`;
					await uploadFile(fileKey, buffer, {
						type: getMimeType(ext as AllowedFileType),
					});

					// Create import job record
					const { jobId } = await createImportJob({
						storeId,
						filename: file.name,
						fileType: ext as AllowedFileType,
						fileKey,
					});

					return Response.json({ jobId, status: "PENDING" });
				} catch (error) {
					menuImportLogger.error({ error }, "Menu import upload failed");
					return Response.json(
						{
							error: error instanceof Error ? error.message : "Upload failed",
						},
						{ status: 500 },
					);
				}
			},
		},
	},
});

/**
 * Get MIME type for file extension.
 */
function getMimeType(fileType: AllowedFileType): string {
	const mimeTypes: Record<AllowedFileType, string> = {
		xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		csv: "text/csv",
		json: "application/json",
		md: "text/markdown",
		txt: "text/plain",
	};
	return mimeTypes[fileType];
}
