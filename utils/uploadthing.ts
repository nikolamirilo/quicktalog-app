import { generateUploadDropzone } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/items/uploadthing/core";

export const UploadDropzone = generateUploadDropzone<OurFileRouter>({
	url: "/api/items/uploadthing",
});
