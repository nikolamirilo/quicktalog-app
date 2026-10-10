"use client";

interface PlanSelectorProps {
	billingCycle: "monthly" | "yearly";
	onBillingCycleChange: (cycle: "monthly" | "yearly") => void;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({
	billingCycle,
	onBillingCycleChange,
}) => {
	return (
		<div className="flex items-center justify-center mb-4 sm:mb-6">
			<div className="relative inline-flex w-full max-w-[260px] bg-product-background border border-product-border rounded-full p-1 shadow-sm">
				<span
					aria-hidden="true"
					className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-product-primary transition-transform duration-300 ease-out ${
						billingCycle === "yearly" ? "translate-x-full" : "translate-x-0"
					}`}
				/>
				<button
					className={`relative z-10 flex-1 px-4 py-1.5 text-sm rounded-full transition-colors font-lora ${
						billingCycle === "monthly"
							? "text-product-foreground font-bold"
							: "text-product-foreground/60 font-medium"
					}`}
					onClick={() => onBillingCycleChange("monthly")}
					type="button"
				>
					Monthly
				</button>
				<button
					className={`relative z-10 flex-1 px-4 py-1.5 text-sm rounded-full transition-colors font-lora ${
						billingCycle === "yearly"
							? "text-product-foreground font-bold"
							: "text-product-foreground/60 font-medium"
					}`}
					onClick={() => onBillingCycleChange("yearly")}
					type="button"
				>
					Yearly
				</button>
			</div>
		</div>
	);
};

export default PlanSelector;
