import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { LimitType, PricingPlan, tiers } from "@quicktalog/common";
import { getLimitContent, getIcon } from "./limits/limitContent";
import LimitsModalHeader from "./limits/LimitsModalHeader";
import NotFoundContent from "./limits/NotFoundContent";
import PlanComparison from "./limits/PlanComparison";

interface LimitsModalProps {
	isOpen: boolean;
	type: LimitType;
	currentPlan?: PricingPlan;
	requiredPlan?: PricingPlan;
	onClose?: () => void;
}

const LimitsModal = ({
	isOpen,
	type = "catalogue",
	currentPlan = tiers[0],
	requiredPlan = tiers[1],
	onClose,
}: LimitsModalProps) => {
	const isNotFound = type === "notFound";
	const content = getLimitContent(type, currentPlan, requiredPlan);
	const IconComponent = getIcon(type);
	const isStandardPlanLimitReached =
		content.currentLimit === content.nextLimit && currentPlan.id >= 4;

	return (
		<AlertDialog open={isOpen}>
			<AlertDialogContent className="w-[95vw] max-w-md xl:max-w-lg mx-auto p-0 bg-product-background border border-product-border shadow-product-shadow rounded-lg overflow-hidden">
				<LimitsModalHeader
					content={content}
					IconComponent={IconComponent}
					isNotFound={isNotFound}
					onClose={onClose}
				/>

				<div className="p-6 sm:p-8 space-y-6">
					{isNotFound ? (
						<NotFoundContent />
					) : (
						<PlanComparison
							content={content}
							currentPlan={currentPlan}
							isStandardPlanLimitReached={isStandardPlanLimitReached}
							requiredPlan={requiredPlan}
						/>
					)}
				</div>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default LimitsModal;
