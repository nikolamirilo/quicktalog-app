import { ImageDropzone } from "@/components/general/ImageDropzone";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentLayout, Item } from "@quicktalog/common";
import { Link2, Upload } from "lucide-react";
import { useEffect, useState } from "react";

interface ItemImageProps {
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
		<div className="space-y-2 pt-3 md:pt-1">
			<p
				className="text-[13.5px] font-semibold leading-none text-product-foreground"
				id="item-image-label"
			>
				Item Image
			</p>
			<Tabs
				className="w-full"
				onValueChange={(v) => setImageTab(v as "upload" | "url")}
				value={imageTab}
			>
				<TabsList
					aria-labelledby="item-image-label"
					className="grid w-full grid-cols-2 sm:inline-flex sm:w-auto"
				>
					<TabsTrigger value="upload">
						<Upload aria-hidden="true" />
						Upload File
					</TabsTrigger>
					<TabsTrigger value="url">
						<Link2 aria-hidden="true" />
						URL
					</TabsTrigger>
				</TabsList>
				<TabsContent value="upload">
					<ImageDropzone
						className="aspect-video w-full"
						image={value.image}
						onUploadComplete={(url) => onChange({ ...value, image: url })}
						removeImage={() => onChange({ ...value, image: "" })}
						setIsUploading={setIsUploading}
					/>
				</TabsContent>
				<TabsContent className="space-y-3" value="url">
					<Input
						aria-label="Image URL"
						inputMode="url"
						onChange={(e) => onChange({ ...value, image: e.target.value })}
						placeholder="https://example.com/image.jpg"
						type="url"
						value={value.image}
					/>
					{value.image && (
						<ImageDropzone
							className="aspect-video w-full"
							image={value.image}
							onUploadComplete={(url) => onChange({ ...value, image: url })}
							removeImage={() => onChange({ ...value, image: "" })}
							setIsUploading={setIsUploading}
						/>
					)}
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default ItemImage;
