"use client"
import clsx from "clsx"
import { motion, Variants } from "framer-motion"
import React, { useState } from "react"
import { FiShare2, FiUpload } from "react-icons/fi"
import { MdOutlineLocalOffer } from "react-icons/md"

const containerVariants: Variants = {
  offscreen: { opacity: 0, y: 100 },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, bounce: 0.2, duration: 0.9, delayChildren: 0.15, staggerChildren: 0.15 },
  },
}

const cardVariants: Variants = {
  offscreen: { opacity: 0, y: 40, scale: 0.96 },
  onscreen: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, bounce: 0.25, duration: 0.7 },
  },
}

type SimpleStep = { step: string; title: string; description: string; image: string; icon: React.ReactNode }

const StepCard: React.FC<{ step: SimpleStep; index: number }> = ({ step }) => {
  const [isHovered, setIsHovered] = useState(false)
  return (
    <motion.div variants={cardVariants} className="h-full">
      <div
        className={clsx(
          "group relative w-full h-full bg-product-background text-product-foreground rounded-xl border border-gray-200 transition-all duration-300 ease-out overflow-hidden",
          {
            "shadow-md hover:shadow-lg hover:scale-101 hover:-translate-y-0.5": !isHovered,
            "shadow-lg scale-101 -translate-y-0.5": isHovered,
          }
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}>
        <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-product-primary/5 to-product-primary/10 overflow-hidden">
          <img
            src={step.image}
            alt={step.title}
            className="w-full h-full px-3 py-3 border-b-2 border-product-border object-contain transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = "none"
              const parent = target.parentElement
              if (parent) {
                parent.innerHTML = `<div class='flex items-center justify-center h-full bg-gradient-to-br from-product-primary/10 to-product-primary/20'>
                  <div class='w-16 h-16 bg-product-primary/20 rounded-2xl flex items-center justify-center text-product-primary'>${String(
                    step.icon
                  )}</div></div>`
              }
            }}
          />
        </div>
        <div className="flex flex-col p-4 sm:p-5 gap-2">
          <h3 className="text-lg font-bold font-lora">{step.title}</h3>
          <p className="text-sm text-product-foreground-accent leading-relaxed font-lora">{step.description}</p>
        </div>
      </div>
    </motion.div>
  )
}

const HowItWorks: React.FC = () => {
  const steps: SimpleStep[] = [
    {
      step: "1",
      title: "Register",
      description: "Create an account and provide more information about your business.",
      icon: <FiUpload className="w-8 h-8" />,
      image: "/images/card1-business.svg",
    },
    {
      step: "2",
      title: "Build your price list",
      description: "Create categories and add services or products with pricing to build your professional price list.",
      icon: <MdOutlineLocalOffer className="w-8 h-8" />,
      image: "/images/card3.svg",
    },
    {
      step: "3",
      title: "Publish & share",
      description: "Go live and share your link or QR code anywhere.",
      icon: <FiShare2 className="w-8 h-8" />,
      image: "/images/card5.svg",
    },
  ]

  return (
    <motion.div className="w-full" variants={containerVariants} initial="offscreen" whileInView="onscreen" viewport={{ once: true }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {steps.map((step, index) => (
          <motion.div key={step.step} variants={cardVariants}>
            <StepCard step={step} index={index} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default HowItWorks
