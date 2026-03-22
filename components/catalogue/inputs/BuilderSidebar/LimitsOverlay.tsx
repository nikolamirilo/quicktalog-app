"use client";
import { Button } from "@/components/ui/button";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { updateCatalogue } from "@/server_actions/catalogue";
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
	const lockSize =
		size === "sm" ? "w-8 h-8" : size === "default" ? "w-10 h-10" : "w-12 h-12";
	const gapSize =
		size === "sm" ? "gap-2" : size === "default" ? "gap-3" : "gap-4";
	const router = useRouter();
	async function handleUpgrade() {
		const promise = updateCatalogue(catalogue);
		toast.promise(promise, {
			loading: "Saving changes...",
			success: "Changes saved successfully",
			error: (err) => "Error occured" + err,
			finally: () => {
				router.push("/pricing");
			},
		});
	}
	return (
		<div
			className={`absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px] rounded-lg p-6 ${gapSize}`}
		>
			<Lock className={`${lockSize} text-muted-foreground`} />
			<h3 className={`font-bold text-center text-foreground ${headingSize}`}>
				Upgrade Required
			</h3>
			<p
				className={`text-muted-foreground text-center w-full max-w-[400px] ${paragraphSize}`}
			>
				{type === "branding"
					? <>Make your catalog truly yours. Add your logo and brand details, and customize the header and footer. <br />Upgrade your plan to unlock this feature.</>
					: "Upgrade your plan to unlock this feature."}
			</p>
			<Button onClick={handleUpgrade} size={size}>
				Upgrade Now
			</Button>
		</div>
	);
};

export default LimitsOverlay;
