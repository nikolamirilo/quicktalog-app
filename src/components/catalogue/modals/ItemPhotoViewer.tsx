"use client";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X } from "lucide-react";
import {
	CatalogueDialog,
	CatalogueDialogClose,
	CatalogueDialogTitle,
	CatalogueLightboxContent,
} from "@/components/catalogue/modals/CatalogueDialog";
import { OptimizedImage } from "@/components/general/OptimizedImage";

interface ItemPhotoViewerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	src: string;
	alt: string;
}

export function ItemPhotoViewer({
	open,
	onOpenChange,
	src,
	alt,
}: ItemPhotoViewerProps) {
	return (
		<CatalogueDialog onOpenChange={onOpenChange} open={open}>
			<CatalogueLightboxContent aria-describedby={undefined}>
				<VisuallyHidden>
					<CatalogueDialogTitle>{alt}</CatalogueDialogTitle>
				</VisuallyHidden>
				<div className="relative h-full w-full">
					<OptimizedImage alt={alt} objectFit="contain" priority src={src} />
				</div>
				<CatalogueDialogClose
					aria-label="Close photo"
					className="absolute right-4 top-4 z-20 flex size-11 items-center justify-center rounded-full bg-white/90 text-[#16140f] shadow-[0_2px_10px_rgba(0,0,0,0.25)] backdrop-blur transition-colors hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
				>
					<X aria-hidden="true" className="size-5" />
				</CatalogueDialogClose>
			</CatalogueLightboxContent>
		</CatalogueDialog>
	);
}
