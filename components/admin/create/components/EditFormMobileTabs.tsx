"use client";

import { Button } from "@/components/ui/button";
import { editSteps } from "@/constants/ui";

interface EditFormMobileTabsProps {
	currentStep: number;
	onStepChange: (step: number) => void;
}

export default function EditFormMobileTabs({
	currentStep,
	onStepChange,
}: EditFormMobileTabsProps) {
	return (
		<nav className="mobile-tab-scroll md:hidden flex flex-row gap-2 overflow-x-auto py-2 px-1 bg-product-background/95 mb-4">
			{editSteps.map((step) => (
				<Button
					key={step.value}
					onClick={() => onStepChange(step.value)}
					variant="nav"
					className={`${
						currentStep === step.value
							? "!bg-product-hover-background !text-navbar-button-active !border !border-product-primary shadow-sm font-semibold hover:scale-[1.03] hover:transform"
							: ""
					} flex items-center justify-center font-body flex-shrink-0 whitespace-nowrap min-w-[80px]`}
					aria-current={currentStep === step.value ? "page" : undefined}
				>
					<span className="flex items-center justify-center mr-1">
						{step.icon}
					</span>
					{step.label}
				</Button>
			))}
		</nav>
	);
}
