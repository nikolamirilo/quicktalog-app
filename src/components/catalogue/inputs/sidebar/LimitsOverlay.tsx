"use client";
import { updateCatalogue } from "@/actions/catalogue";
import { IconTile } from "@/components/general/IconTile";
import { Button } from "@/components/ui/button";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const LimitsOverlay = ({
	size = "default",
	type = "other",
}: {
	size?: "sm" | "default" | "lg";
	type?: "branding" | "other";
}) => {
	const { catalogue } = useCatalogueContext();
	const paragraphSize =
		size === "sm" ? "text-sm" : size === "default" ? "text-base" : "text-lg";
	const headingSize =
		size === "sm" ? "text-base" : size === "default" ? "text-lg" : "text-xl";
	const tileSize = size === "sm" ? "sm" : size === "default" ? "md" : "lg";
	const gapSize =
		size === "sm" ? "gap-2" : size === "default" ? "gap-3" : "gap-4";
	const router = useRouter();
	async function handleUpgrade() {
		const promise = updateCatalogue(catalogue);
		toast.promise(promise, {
			loading: "Saving changes...",
			success: "Changes saved successfully",
			error: "Could not save your changes",
			finally: () => {
				router.push("/pricing");
			},
		});
	}
	return (
		<div
			className={`absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[inherit] bg-product-card/75 p-6 font-product-body backdrop-blur-[2px] ${gapSize}`}
		>
			<IconTile size={tileSize}>
				<Lock />
			</IconTile>
			<h3
				className={`text-center font-product-heading font-bold text-product-foreground ${headingSize}`}
			>
				Upgrade required
			</h3>
			<p
				className={`w-full max-w-[400px] text-center text-product-foreground-accent ${paragraphSize}`}
			>
				{type === "branding" ? (
					<>
						Make your catalog truly yours. Add your logo and brand details, and
						customize the header and footer. <br />
						Upgrade your plan to unlock this feature.
					</>
				) : (
					"Upgrade your plan to unlock this feature."
				)}
			</p>
			<Button onClick={handleUpgrade} size={size}>
				Upgrade now
			</Button>
		</div>
	);
};

export default LimitsOverlay;
