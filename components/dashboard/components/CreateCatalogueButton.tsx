"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCatalogueContext } from "@/context/CatalogueContext";
import InitCatalogueModal from "@/components/catalogue/modals/InitCatalogueModal";
import { createCatalogue } from "@/actions/items";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { IoCreateOutline } from "react-icons/io5";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import Link from "next/link";
import { toast } from "sonner";

interface CreateCatalogueButtonProps {
	disabled?: boolean;
	showUpgradeTooltip?: boolean;
}

const CreateCatalogueButton = ({
	disabled = false,
	showUpgradeTooltip = false,
}: CreateCatalogueButtonProps) => {
	const router = useRouter();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const { user } = useUser();

	const { catalogue } = useCatalogueContext();

	const handleCreateCatalog = async () => {
		setLoading(true);

		try {
			console.log("Creating catalog with data:", catalogue);
			const result = await createCatalogue(catalogue);

			if (result.success) {
				console.log("Catalog created successfully!", result.data);
				toast.success(`Catalogue "${result.data.name}" created successfully!`);
				setIsModalOpen(false);

				// Navigate to the builder page with the catalogue name
				setTimeout(() => {
					router.push(`/admin/${result.data.name}/builder`);
				}, 200);
			} else {
				console.error("Failed to create catalog:", result.error);
				toast.error(result.error || "Failed to create catalogue");
			}
		} catch (error) {
			console.error("Unexpected error:", error);
			toast.error("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	const handleButtonClick = () => {
		if (!disabled) {
			setIsModalOpen(true);
		}
	};

	return (
		<>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<span className="w-9/12 sm:w-fit">
							<Button
								className="w-full"
								disabled={disabled}
								onClick={handleButtonClick}
							>
								<IoCreateOutline
									className="sm:w-5 sm:h-5 md:w-6 md:h-6"
									size={18}
								/>{" "}
								Create Catalogue
							</Button>
						</span>
					</TooltipTrigger>
					{showUpgradeTooltip && disabled && (
						<TooltipContent className="max-w-[240px] border-none shadow-lg">
							<div className="flex flex-col gap-3">
								<p className="text-sm leading-relaxed">
									Upgrade to unlock more catalogues and get higher limits.
								</p>
								<Link href="/pricing">
									<Button size="sm">View Pricing</Button>
								</Link>
							</div>
						</TooltipContent>
					)}
				</Tooltip>
			</TooltipProvider>

			<InitCatalogueModal
				isOpen={isModalOpen}
				onConfirm={handleCreateCatalog}
				onCancel={() => setIsModalOpen(false)}
				loading={loading}
			/>
		</>
	);
};

export default CreateCatalogueButton;
