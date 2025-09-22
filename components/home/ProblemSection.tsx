"use client"
import { Button } from "@/components/ui/button"
import { motion, Variants } from "framer-motion"
import Link from "next/link"
import React from "react"
import { FiArrowRight, FiCheckSquare, FiClock, FiDollarSign, FiSmartphone, FiXSquare } from "react-icons/fi"

const containerVariants: Variants = {
  offscreen: {
    opacity: 0,
    y: 100,
  },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      bounce: 0.2,
      duration: 0.9,
      delayChildren: 0.2,
      staggerChildren: 0.15,
    },
  },
}

const cardVariants: Variants = {
  offscreen: {
    opacity: 0,
    y: 50,
    scale: 0.9,
  },
  onscreen: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      bounce: 0.3,
      duration: 0.8,
    },
  },
}

interface FlipCardProps {
  metric: string
  metricLabel: string
  problem: string
  solution: string
  ctaText: string
  impactMetric: string
  icon: React.ReactNode
  isReversed?: boolean
  index: number
}

const CARD_STYLES = {
  minHeight: "min-h-[180px] sm:min-h-[200px] md:min-h-[220px]",
  padding: "p-4 sm:p-6",
  gap: "gap-4 sm:gap-6 lg:gap-8",
  rounded: "rounded-3xl",
  transition: "transition-all duration-300",
} as const

const FlipCard: React.FC<FlipCardProps> = ({
  metric,
  metricLabel,
  problem,
  solution,
  ctaText,
  impactMetric,
  icon,
  isReversed: _isReversed = false,
  index,
}) => {
  return (
    <motion.div
      className="group focus:outline-none focus-visible:ring-0 focus-visible:ring-transparent rounded-3xl problem-card no-tap-highlight"
      variants={cardVariants}>
      <div
        className={`${CARD_STYLES.rounded} ${CARD_STYLES.padding} bg-product-background border border-product-border ${CARD_STYLES.transition} shadow-md`}>


        {/* Body: two equal columns - Current Reality | Our Solution */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 sm:gap-6 items-start md:items-stretch">
          {/* Current Reality */}
          <div className="flex flex-col md:pr-6 pl-0 md:pl-0 rounded-none">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center bg-problem-card-bg text-error">
                <FiXSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-[15px] sm:text-lg font-bold text-product-foreground font-lora">The Challenge</h3>
            </div>
            <p className="text-[14px] sm:text-[15px] text-product-foreground-accent leading-relaxed font-lora">
              {problem}
            </p>
          </div>

          {/* Separator column (mobile: horizontal; desktop: vertical) */}
          <div className="flex items-center justify-center">
            {/* Mobile horizontal track */}
            <div className="md:hidden h-px w-full bg-product-primary/20 rounded-full overflow-hidden" aria-hidden="true">
              <motion.div
                className="h-full bg-product-primary rounded-full"
                initial={{ width: 0 }}
                whileInView={{ width: '100%' }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{ transformOrigin: 'right center' }}
              />
            </div>
            {/* Desktop vertical track */}
            <div className="hidden md:block w-px h-full bg-product-primary/20 rounded-full overflow-hidden" aria-hidden="true">
              <motion.div
                className="w-full bg-product-primary rounded-full"
                initial={{ height: 0 }}
                whileInView={{ height: '100%' }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{ transformOrigin: 'bottom center' }}
              />
            </div>
          </div>

          {/* Our Solution */}
          <div className="flex flex-col md:pl-6 pl-0 md:border-l-0 rounded-none">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center bg-product-primary/10 text-product-primary">
                <FiCheckSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <h3 className="text-[15px] sm:text-lg font-bold text-product-foreground font-lora">Our Solution</h3>
            </div>
            <p className="text-[14px] sm:text-[15px] text-product-foreground-accent leading-relaxed font-lora mb-3">
              {solution}
            </p>
            <div className="mt-auto w-full flex flex-col lg:flex-row items-start lg:items-center justify-start lg:justify-between gap-2 lg:gap-3">
              <span className="text-xs sm:text-sm text-product-foreground-accent opacity-80 font-lora">{impactMetric}</span>
              <Link href="/auth?mode=signup" className="w-full lg:w-auto">
                <Button variant="default" size="sm" className="no-tap-highlight w-full">
                  <span>{ctaText}</span>
                  <FiArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

const ProblemSection: React.FC = () => {
  const problems = [
    {
      metric: "No Code",
      metricLabel: "No design skills required",
      problem:
        "Creating professional catalogs usually requires hiring designers or learning complex software. Most businesses end up with outdated printed catalogs or basic PDF files.",
      solution:
        "Our intuitive catalog maker lets you create stunning digital catalogs in minutes. Choose from professional templates or let AI generate your catalog automatically.",
      ctaText: "Start Creating",
      impactMetric: "Professional results, zero experience needed",
      icon: <FiSmartphone />,
    },
    {
      metric: "< 5 Mins",
      metricLabel: "to update your catalog",
      problem:
        "Printed catalogs become outdated the moment you print them. Price changes, new products, or sold-out items leave customers with wrong information.",
      solution:
        "Update your digital catalog instantly from any device. Changes appear immediately across all platforms - no reprinting, no delays, no confusion.",
      ctaText: "See Live Updates",
      impactMetric: "Always current, always accurate",
      icon: <FiClock />,
      isReversed: true,
    },
    {
      metric: "Share",
      metricLabel: "with a simple link or QR code",
      problem:
        "Distributing printed catalogs is expensive and wasteful. Customers lose them, and you never know who's actually looking at your products.",
      solution:
        "Share your catalog instantly with a link or QR code. Track views, see what customers browse most, and reach unlimited customers at zero distribution cost.",
      ctaText: "Try It Now",
      impactMetric: "Unlimited reach, detailed analytics",
      icon: <FiDollarSign />,
    },
  ]

  return (
    <motion.div
      className="max-w-6xl mx-auto space-y-12 lg:space-y-12 no-tap-highlight"
      variants={containerVariants}
      initial="offscreen"
      whileInView="onscreen"
      viewport={{ once: true }}
      style={{
        WebkitTapHighlightColor: "transparent",
        WebkitTouchCallout: "none",
        outline: "none",
      }}>
      {problems.map((problem, index) => (
        <FlipCard key={index} {...problem} isReversed={index % 2 === 1} index={index} />
      ))}
    </motion.div>
  )
}

export default ProblemSection
