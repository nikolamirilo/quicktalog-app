"use client"

import { Button } from "@/components/ui/button"
import { FiEdit3, FiLayers, FiSettings } from "react-icons/fi"
import { IoDiamondOutline } from "react-icons/io5"
import { PiPaintBrushDuotone } from "react-icons/pi"

const editSteps = [
  {
    value: 1,
    label: "General",
    icon: <FiEdit3 size={18} />,
  },
  {
    value: 2,
    label: "Categories",
    icon: <FiLayers size={18} />,
  },
  {
    value: 3,
    label: "Services",
    icon: <FiSettings size={18} />,
  },
  {
    value: 4,
    label: "Branding",
    icon: <IoDiamondOutline size={18} />,
  },
  {
    value: 5,
    label: "Appearance",
    icon: <PiPaintBrushDuotone size={18} />,
  },
]

interface EditFormMobileTabsProps {
  currentStep: number
  onStepChange: (step: number) => void
}

export default function EditFormMobileTabs({ currentStep, onStepChange }: EditFormMobileTabsProps) {
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
          aria-current={currentStep === step.value ? "page" : undefined}>
          <span className="flex items-center justify-center mr-1">{step.icon}</span>
          {step.label}
        </Button>
      ))}
    </nav>
  )
}
