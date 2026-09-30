import { builderFieldClass } from "@/components/catalogue/modals/content/BuilderDialog";
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
		<Tabs
			className="flex w-full flex-col gap-1.5"
			onValueChange={(v) => setImageTab(v as "upload" | "url")}
			value={imageTab}
		>
			<div className="flex items-center justify-between gap-3">
				<p
					className="text-[13.5px] font-semibold leading-none text-product-foreground"
					id="item-image-label"
				>
					Image
				</p>
				<TabsList aria-labelledby="item-image-label" className="h-8 p-0.5">
					<TabsTrigger
						className="gap-1.5 px-2.5 text-[12.5px] [&_svg]:size-3.5"
						value="upload"
					>
						<Upload aria-hidden="true" />
						Upload
					</TabsTrigger>
					<TabsTrigger
						className="gap-1.5 px-2.5 text-[12.5px] [&_svg]:size-3.5"
						value="url"
					>
						<Link2 aria-hidden="true" />
						URL
					</TabsTrigger>
				</TabsList>
			</div>
			<TabsContent className="mt-0" value="upload">
				<ImageDropzone
					className="w-full max-md:h-32"
					image={value.image}
					onUploadComplete={(url) => onChange({ ...value, image: url })}
					removeImage={() => onChange({ ...value, image: "" })}
					setIsUploading={setIsUploading}
				/>
			</TabsContent>
			<TabsContent className="mt-0 space-y-3" value="url">
				<Input
					aria-label="Image URL"
					className={builderFieldClass}
					inputMode="url"
					onChange={(e) => onChange({ ...value, image: e.target.value })}
					placeholder="https://example.com/image.jpg"
					type="url"
					value={value.image}
				/>
				{value.image && (
					<ImageDropzone
						className="w-full max-md:h-32"
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
