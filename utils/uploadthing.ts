import {
	generateUploadButton,
	generateUploadDropzone,
} from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/items/uploadthing/core";

export const UploadButton = generateUploadButton<OurFileRouter>({
	url: "/api/items/uploadthing",
});
export const UploadDropzone = generateUploadDropzone<OurFileRouter>({
	url: "/api/items/uploadthing",
});
