import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { withinRateLimit } from "@/lib/rate-limit";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
	// Define as many FileRoutes as you like, each with a unique routeSlug
	imageUploader: f({
		image: {
			/**
			 * For full list of options and defaults, see the File Route API reference
			 * @see https://docs.uploadthing.com/file-routes#route-config
			 */
			maxFileSize: "4MB",
			maxFileCount: 1,
		},
	})
		// Set permissions and file types for this FileRoute
		.middleware(async () => {
			// Runs on the server before upload; throwing rejects the upload.
			const me = await getVerifiedIdentity();
			if (!me) throw new UploadThingError("Unauthorized");
			if (!(await withinRateLimit("upload", me.userId))) {
				throw new UploadThingError("Too many uploads, try again later");
			}

			// Available in onUploadComplete as `metadata`.
			return { userId: me.userId };
		})
		.onUploadComplete(async ({ metadata, file }) => {
			console.log("file url", file.ufsUrl);

			// !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
			return { uploadedBy: metadata.userId };
		}),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
