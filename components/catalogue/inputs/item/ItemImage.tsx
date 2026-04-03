import ImageDropzone from "@/components/general/ImageDropzone";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Item, ContentLayout } from "@quicktalog/common";
import { useEffect, useState } from "react";

export interface ItemImageProps {
	value: Item;
	onChange: (value: Item) => void;
	layout?: ContentLayout | null;
	onUploadingChange?: (isUploading: boolean) => void;
}

const ItemImage = ({
	value,
	onChange,
	layout,
	onUploadingChange,
}: ItemImageProps) => {
	const [imageTab, setImageTab] = useState<"upload" | "url">("upload");
	const [isUploading, setIsUploading] = useState(false);

	useEffect(() => {
		onUploadingChange?.(isUploading);
	}, [isUploading, onUploadingChange]);

	if (layout === "variant_3") return null;

	return (
		<Tabs
			className="w-full"
			onValueChange={(v) => setImageTab(v as any)}
			value={imageTab}
		>
			<TabsList className="bg-transparent p-0 border-b border-gray-200 w-full justify-start rounded-none h-auto">
				<TabsTrigger
					className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:shadow-none px-4 pb-2"
					value="upload"
				>
					Upload File
				</TabsTrigger>
				<TabsTrigger
					className="rounded-none border-b-2 border-transparent data-[state=active]:border-gray-900 data-[state=active]:shadow-none px-4 pb-2"
					value="url"
				>
					URL
				</TabsTrigger>
			</TabsList>
			<TabsContent className="pt-4" value="upload">
				<ImageDropzone
					className="w-full aspect-video"
					image={value.image}
					onUploadComplete={(url) => onChange({ ...value, image: url })}
					removeImage={() => onChange({ ...value, image: "" })}
					setIsUploading={setIsUploading}
				/>
			</TabsContent>
			<TabsContent className="py-2" value="url">
				<Input
					onChange={(e) => onChange({ ...value, image: e.target.value })}
					placeholder="https://example.com/image.jpg"
					value={value.image}
				/>
				{value.image && (
					<ImageDropzone
						className="w-full aspect-video"
						image={value.image}
						onUploadComplete={(url) => onChange({ ...value, image: url })}
						removeImage={() => onChange({ ...value, image: "" })}
						setIsUploading={setIsUploading}
					/>
				)}
			</TabsContent>
		</Tabs>
	);
};

export default ItemImage;
