import { LimitType } from "@/types/enums"
import { ArrowRight, Crown, Lock } from "lucide-react"
import Link from "next/link"
import { IoSearch } from "react-icons/io5"
import { Button } from "../ui/button"

const LimitsModal = ({
  type,
  currentPlan = "Starter",
  requiredPlan = "Pro",
  onClose,
}: {
  type: LimitType
  currentPlan?: string
  requiredPlan?: string
  onClose?: () => void | undefined
}) => {
  const isTraffic = type === "traffic"
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-product-background rounded-lg shadow-lg max-w-md w-[95vw] sm:w-full mx-auto overflow-hidden">
        {/* Header */}
        <div className="relative p-4 sm:p-6 text-center bg-hero-product-background">
          {onClose ? (
            <button
              className="absolute top-4 right-4 text-product-foreground-accent hover:text-product-foreground transition-colors"
              onClick={onClose}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          ) : (
            <Link
              href="/admin/dashboard"
              className="absolute top-4 right-4 text-product-foreground-accent hover:text-product-foreground transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Link>
          )}

          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-product-primary">
              {isTraffic ? (
                <IoSearch className="w-6 h-6 sm:w-8 sm:h-8 text-product-secondary" />
              ) : (
                <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-product-secondary" />
              )}
            </div>
          </div>

          <h2 className="text-lg sm:text-xl font-semibold mb-2 text-product-foreground">
            {isTraffic ? "Catalogue Not Found" : "Upgrade Required"}
          </h2>
          <p className="text-sm text-product-foreground-accent">
            {isTraffic
              ? "The selected catalogue is inactive or doesn't exist."
              : `You've used all available ${type === "ai" ? "AI prompts" : type === "catalogue" ? "Catalogues" : type === "ocr" ? "OCR imports" : "features"} in your plan.`}
          </p>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {isTraffic ? (
            <>
              {/* Quicktalog Promotional Content */}
              <div className="p-3 sm:p-4 rounded-lg bg-product-hover-background mb-4 sm:mb-6">
                <h3 className="text-base font-medium text-product-foreground mb-2">
                  Create Your Digital Catalog with Quicktalog
                </h3>
                <p className="text-sm text-product-foreground-accent">
                  Transform your products into beautiful, mobile-friendly digital catalogs. No
                  coding required - share via QR codes and get real-time analytics.
                </p>
              </div>

              <Link href="https://www.quicktalog.app" target="_blank">
                <Button variant="cta" className="w-full">
                  Get Started Today
                </Button>
              </Link>
            </>
          ) : (
            <>
              {/* Upgrade flow for AI/OCR limits */}
              <div className="flex items-center justify-between my-4 sm:my-6 p-3 rounded-lg bg-product-hover-background">
                <div className="text-sm">
                  <div className="text-product-foreground-accent">Current plan</div>
                  <div className="font-medium text-product-foreground">{currentPlan}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-product-icon" />
                <div className="text-sm text-right">
                  <div className="text-product-foreground-accent">Required plan</div>
                  <div className="font-medium flex items-center justify-end space-x-1 text-product-secondary">
                    <Crown className="w-4 h-4 text-product-primary" />
                    <span>{requiredPlan}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center">
                <Link
                  href="/pricing"
                  className="w-full sm:w-fit py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-medium text-sm transition-all duration-200 transform hover:scale-105 hover:-translate-y-0.5 focus:outline-none focus:ring-3 focus:ring-opacity-20 bg-product-primary text-product-secondary hover:bg-product-primary-accent shadow-sm hover:shadow-md">
                  Upgrade to {requiredPlan}
                </Link>
              </div>
            </>
          )}

          {/* Small print */}
          <p className="text-xs text-center mt-3 sm:mt-4 px-2 text-product-foreground-accent">
            {isTraffic
              ? "Join thousands of businesses already using Quicktalog to showcase their offerings digitally."
              : `Upgrade to get more ${type === "ai" ? "AI prompts" : type === "catalogue" ? "catalogues" : type === "ocr" ? "OCR imports" : "features"} and unlock additional premium features.`}
          </p>
        </div>
      </div>
    </div>
  )
}

export default LimitsModal
