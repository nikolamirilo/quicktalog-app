"use client"
import { Button } from "@/components/ui/button"
import { tiers } from "@/constants/pricing"
import { formatPrice } from "@/helpers/client"
import { PricingPlan, User } from "@/types"
import { Paddle } from "@paddle/paddle-js"
import clsx from "clsx"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { BsFillCheckCircleFill } from "react-icons/bs"

interface PricingColumnProps {
  tier: PricingPlan
  highlight?: boolean
  price: string
  billingCycle: "monthly" | "yearly"
  paddle: Paddle
  priceId: string
  user: User
}

const PricingColumn: React.FC<PricingColumnProps> = ({ tier, highlight, price, billingCycle, paddle, priceId, user }) => {
  const [isHovered, setIsHovered] = useState(false)
  const router = useRouter()
  const getFeatureList = (features: PricingPlan["features"]) => {
    return [
      features.support,
      `${features.catalogues} ${features.catalogues > 1 ? "catalogues" : "catalogue"}`,
      `${features.analytics} analytics`,
      `${features.traffic_limit.toLocaleString()} traffic limit`,
      `${features.customization} customization`,
      features.ocr_ai_import == 0 ? null : `${features.ocr_ai_import} OCR AI imports`,
      features.ai_catalogue_generation == 0 ? null : `${features.ai_catalogue_generation} AI catalogue generations`,
      features.newsletter ? "Newsletter" : null,
      features.custom_features ? "Custom features" : null,
    ].filter(Boolean)
  }
  const displayPrice = price ? formatPrice(price) : "N/A"
  const cycleLabel = billingCycle === "yearly" ? "/year" : "/month"

  return (
    <div
      className={clsx(
        "group relative w-full max-w-sm mx-auto bg-product-background text-product-foreground rounded-2xl border border-product-border lg:max-w-full transition-all duration-300 ease-out h-full flex flex-col",
        {
          "shadow-[var(--product-shadow)] hover:shadow-[var(--product-hover-shadow)]": !highlight,
          "shadow-[var(--product-hover-shadow)] hover:shadow-[0_16px_50px_rgba(0,0,0,0.18)]": highlight,
          "hover:scale-[1.02] hover:-translate-y-1": true,
        }
      )}
      style={{ boxShadow: highlight ? "var(--product-hover-shadow)" : "var(--product-shadow)" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>
      {/* Header Section - Clean and spacious */}
      <div className="p-8 flex-shrink-0">
        <h3
          className={clsx(
            "text-xl font-bold mb-3 text-product-primary transition-colors duration-300 font-lora",
            { "text-product-primary-accent": highlight && isHovered }
          )}>
          {tier.name}
        </h3>
        <p className="text-product-foreground-accent mb-4 text-sm leading-relaxed font-lora">
          {tier.description}
        </p>

        <div className="mb-6">
          <span
            className={clsx(
              "text-4xl font-bold text-product-foreground transition-all duration-300 font-lora",
              { "scale-105": isHovered }
            )}>
            {displayPrice}
          </span>
          <span className="text-sm font-normal text-product-foreground-accent ml-2 font-lora">
            {cycleLabel}
          </span>
        </div>

        <Button
          variant={highlight ? "cta" : "cta-secondary"}
          className="w-full py-3 rounded-lg font-semibold transition-all duration-200 hover:scale-[1.02]"
          onClick={() => {
            if (user) {
              const matchedTier = tiers.find((tier) => Object.values(tier.priceId).includes(user.plan_id))
              if (tier.name === matchedTier.name) {
                alert("You currently have this plan")
              } else {
                paddle.Checkout.open({
                  items: [
                    { priceId: priceId, quantity: 1 }
                  ],
                  customer: user?.email
                    ? { email: user.email }
                    : undefined,
                  settings: {
                    successUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/admin/checkout/success`,
                  }
                })
              }
            } else {
              router.push("/auth")
            }

          }}
        >
          {user ? (() => {
            const currentTier = tiers.find(t =>
              Object.values(t.priceId).includes(user.plan_id)
            );

            if (!currentTier) return "Get Started";

            if (currentTier.name === tier.name) return "Current Plan";
            return currentTier.id > tier.id ? "Downgrade" : "Upgrade";
          })() : "Get Started"}
        </Button>
      </div>

      {/* Features Section - Clean list with proper spacing */}
      <div className="px-8 pb-8 flex-grow">
        <p className="font-bold mb-2 text-sm uppercase tracking-wider text-product-foreground transition-colors duration-300 group-hover:text-product-primary font-lora">
          FEATURES
        </p>

        <ul className="space-y-3">
          {getFeatureList(tier.features).map((feature, index) => (
            <li key={index} className="flex items-start transition-all duration-300">
              <div className="flex-shrink-0 w-5 h-5 bg-product-primary/10 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <BsFillCheckCircleFill className="w-3 h-3 text-product-primary" />
              </div>
              <span className="text-sm text-product-foreground-accent leading-relaxed font-lora">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Popular badge for highlighted plan */}
      {highlight && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="bg-product-primary text-product-background px-4 py-1 shadown-md rounded-full text-xs font-semibold shadow-lg transition-all duration-300 group-hover:scale-105">
            Most Popular
          </div>
        </div>
      )}
    </div>
  )
}

export default PricingColumn
