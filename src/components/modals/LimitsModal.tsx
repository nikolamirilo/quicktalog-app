import { type LimitType, type PricingPlan, tiers } from "@quicktalog/common";

import { AppDialogContent } from "@/components/modals/AppDialog";
import {
	getIcon,
	getLimitContent,
} from "@/components/modals/limits/limitContent";
import { LimitsModalHeader } from "@/components/modals/limits/LimitsModalHeader";
import { LimitUpgradeComparison } from "@/components/modals/limits/LimitUpgradeComparison";
import { NotFoundContent } from "@/components/modals/limits/NotFoundContent";
import { AlertDialog } from "@/components/ui/alert-dialog";

interface LimitsModalProps {
	isOpen: boolean;
	type: LimitType;
	currentPlan?: PricingPlan;
	requiredPlan?: PricingPlan;
	onClose?: () => void;
}

export const LimitsModal = ({
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
			<AppDialogContent>
				<LimitsModalHeader
					content={content}
					IconComponent={IconComponent}
					isNotFound={isNotFound}
					onClose={onClose}
				/>
				{isNotFound ? (
					<NotFoundContent />
				) : (
					<LimitUpgradeComparison
						content={content}
						currentPlan={currentPlan}
						isStandardPlanLimitReached={isStandardPlanLimitReached}
						requiredPlan={requiredPlan}
					/>
				)}
			</AppDialogContent>
		</AlertDialog>
	);
};
