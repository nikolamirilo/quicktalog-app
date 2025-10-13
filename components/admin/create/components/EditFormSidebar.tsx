"use client";

import { Button } from "@/components/ui/button";
import { editSteps } from "@/constants/ui";

interface EditFormSidebarProps {
	currentStep: number;
	onStepChange: (step: number) => void;
	getSidebarButtonClass: (isActive: boolean) => string;
}

export default function EditFormSidebar({
	currentStep,
	onStepChange,
	getSidebarButtonClass,
}: EditFormSidebarProps) {
	return (
		<aside className="hidden md:block w-56 flex-shrink-0 bg-product-background/90 border border-product-border shadow-md rounded-2xl sticky top-24 self-start">
			<div className="p-4">
				<h3 className="text-lg font-semibold text-product-foreground mb-4 font-heading">
					Edit Steps
				</h3>
				<nav className="flex flex-col gap-2 md:gap-3">
					{editSteps.map((step) => (
						<Button
							key={step.value}
							onClick={() => onStepChange(step.value)}
							variant="nav"
							className={`${getSidebarButtonClass(currentStep === step.value)} flex items-center justify-start`}
							aria-current={currentStep === step.value ? "page" : undefined}
						>
							<span className="flex items-center justify-center">
								{step.icon}
							</span>
							{step.label}
						</Button>
					))}
				</nav>
			</div>
		</aside>
	);
}
