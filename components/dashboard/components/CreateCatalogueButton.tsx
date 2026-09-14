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
import { getRequiredPlan } from "@/helpers/client";
import { useCreateCatalogue } from "@/hooks/useCreateCatalogue";
import Link from "next/link";
import { IoCreateOutline } from "react-icons/io5";

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
	const {
		userData,
		isModalOpen,
		setIsModalOpen,
		limitsModal,
		setLimitsModal,
		loading,
		handleButtonClick,
		handleCreateCatalogue,
	} = useCreateCatalogue(disabled);

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
								className="h-[50px] px-7 py-3.5 text-base min-w-[200px] sm:h-14 sm:px-8 sm:py-4 sm:text-lg sm:min-w-56 text-wrap w-fit"
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
				requiredPlan={
					userData
						? getRequiredPlan(userData.currentPlan, "catalogue")
						: undefined
				}
				type="catalogue"
			/>
		</>
	);
};

export default CreateCatalogueButton;
