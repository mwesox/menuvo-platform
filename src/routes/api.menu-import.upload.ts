import { createFileRoute } from "@tanstack/react-router";
import { createImportJob } from "@/features/console/menu-import/server/import.helpers";
import {
	type AllowedFileType,
	allowedFileTypes,
} from "@/features/console/menu-import/validation";
import { enqueueImportJob } from "@/lib/queue/menu-import-queue";
import { uploadFile } from "@/lib/storage/files-client";

/**
 * Menu Import Upload API Route
 *
 * Accepts FormData with file data for menu import.
 *
 * FormData fields:
 * - file: File (menu file - xlsx, csv, json, md, txt)
 * - storeId: string (will be parsed as number)
 */
export const Route = createFileRoute("/api/menu-import/upload")({
	server: {
		handlers: {
			POST: async ({ request }) => {
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

				const storeId = Number(storeIdStr);
				if (Number.isNaN(storeId) || storeId <= 0) {
					return Response.json({ error: "Invalid storeId" }, { status: 400 });
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

					// Enqueue for background processing
					await enqueueImportJob(jobId);

					return Response.json({ jobId, status: "PROCESSING" });
				} catch (error) {
					console.error("Menu import upload failed:", error);
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
