"use client"

import { Button } from "@/components/ui/button"
import { FiEdit3, FiLayers, FiSettings } from "react-icons/fi"
import { IoDiamondOutline } from "react-icons/io5"
import { PiPaintBrushDuotone } from "react-icons/pi"

const editSteps = [
  {
    value: 1,
    label: "General Info",
    icon: <FiEdit3 className="mr-2" size={20} />,
    description: "Basic information",
  },
  {
    value: 2,
    label: "Categories",
    icon: <FiLayers className="mr-2" size={20} />,
    description: "Service categories",
  },
  {
    value: 3,
    label: "Services",
    icon: <FiSettings className="mr-2" size={20} />,
    description: "Service details",
  },
  {
    value: 4,
    label: "Branding",
    icon: <IoDiamondOutline className="mr-2" size={20} />,
    description: "Customization",
  },
  {
    value: 5,
    label: "Appearance",
    icon: <PiPaintBrushDuotone size={18} />,
  },
]

interface EditFormSidebarProps {
  currentStep: number
  onStepChange: (step: number) => void
  getSidebarButtonClass: (isActive: boolean) => string
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
              aria-current={currentStep === step.value ? "page" : undefined}>
              <span className="flex items-center justify-center">{step.icon}</span>
              {step.label}
            </Button>
          ))}
        </nav>
      </div>
    </aside>
  )
}
