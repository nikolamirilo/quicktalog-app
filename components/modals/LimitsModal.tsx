import { AlertDialog, AlertDialogContent } from "@/components/ui/alert-dialog";
import { LimitType, PricingPlan, tiers } from "@quicktalog/common";
import { getLimitContent, getIcon } from "./limits/limitContent";
import LimitsModalHeader from "./limits/LimitsModalHeader";
import NotFoundContent from "./limits/NotFoundContent";
import PlanComparison from "./limits/LimitUpgradeComparison";

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
		content.currentLimit === content.nextLimit &&
		currentPlan.id === requiredPlan?.id;

	return (
		<AlertDialog open={isOpen}>
			<AlertDialogContent className="w-[98vw] sm:w-[95vw] max-w-md xl:max-w-lg mx-auto p-0 bg-product-background border border-product-border shadow-product-shadow overflow-hidden max-h-[90dvh] flex flex-col">
				<LimitsModalHeader
					content={content}
					IconComponent={IconComponent}
					isNotFound={isNotFound}
					onClose={onClose}
				/>

				<div className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
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
