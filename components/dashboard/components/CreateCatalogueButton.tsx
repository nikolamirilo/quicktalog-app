"use client";
import InitCatalogueModal from "@/components/catalogue/modals/InitCatalogueModal";
import LimitsModal from "@/components/modals/LimitsModal";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useUserContext } from "@/context/UserContext";
import { createCatalogue } from "@/server_actions/catalogue";
import { tiers } from "@quicktalog/common";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IoCreateOutline } from "react-icons/io5";
import { toast } from "sonner";

interface CreateCatalogueButtonProps {
	disabled?: boolean;
	type?: "home" | "dashboard";
	showUpgradeTooltip?: boolean;
	className?: string;
}

const CreateCatalogueButton = ({
	disabled = false,
	showUpgradeTooltip = false,
	type = "dashboard",
	className = "",
}: CreateCatalogueButtonProps) => {
	const router = useRouter();
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [limitsModal, setLimitsModal] = useState(false);
	const [loading, setLoading] = useState(false);
	const { catalogue, resetCatalogue } = useCatalogueContext();
	const { userData, refreshUserData } = useUserContext();
	const handleCreateCatalogue = async () => {
		setLoading(true);
		if (userData) {
			try {
				console.log("Creating catalog with data:", catalogue);
				const result = await createCatalogue(
					catalogue,
					userData?.currentPlan?.features?.branding,
				);

				if (result.success) {
					console.log("Catalogue created successfully!", result.data);
					toast.success(
						`Catalogue "${result.data.name}" created successfully!`,
					);
					setIsModalOpen(false);

					resetCatalogue();
					await refreshUserData();
					router.refresh();

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
		} else {
			router.push("/auth?mode=signup");
		}
	};

	const handleButtonClick = () => {
		if (!userData) {
			router.push("/auth?mode=signup");
			return;
		}
		if (userData.usage.catalogues >= userData.currentPlan.features.catalogues) {
			setLimitsModal(true);
			return;
		}
		if (!disabled) {
			resetCatalogue();
			setIsModalOpen(true);
			return;
		}
	};

	return (
		<>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						{type === "dashboard" ? (
							<Button
								className={`w-full ${className}`}
								disabled={disabled}
								onClick={handleButtonClick}
							>
								<IoCreateOutline
									className="sm:w-5 sm:h-5 md:w-6 md:h-6"
									size={18}
								/>{" "}
								Create Catalogue
							</Button>
						) : (
							<Button
								aria-label="Create your digital catalog"
								className="h-14 px-8 py-4 text-lg text-wrap min-w-56 w-fit"
								disabled={disabled}
								onClick={handleButtonClick}
								variant="cta"
							>
								Start Creating Now
							</Button>
						)}
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
				loading={loading}
				onCancel={() => setIsModalOpen(false)}
				onConfirm={handleCreateCatalogue}
			/>
			<LimitsModal
				currentPlan={userData?.currentPlan}
				isOpen={limitsModal}
				onClose={() => setLimitsModal(false)}
				requiredPlan={userData?.nextPlan || tiers[tiers.length - 1]}
				type="catalogue"
			/>
		</>
	);
};

export default CreateCatalogueButton;
