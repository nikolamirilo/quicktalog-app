"use client"
import { faqs } from "@/constants/details"
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react"
import { motion, Variants } from "framer-motion"
import React, { useState } from "react"
import { FiMinus, FiPlus } from "react-icons/fi"

const containerVariants: Variants = {
  offscreen: {
    opacity: 0,
    y: 50,
  },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      bounce: 0.2,
      duration: 0.8,
      delayChildren: 0.1,
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  offscreen: {
    opacity: 0,
    y: 20,
  },
  onscreen: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      bounce: 0.3,
      duration: 0.6,
    },
  },
}

const FAQ: React.FC = () => {
  const [showAll, setShowAll] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  const displayedFaqs = showAll ? faqs : faqs.slice(0, 5)
  const hasMore = faqs.length > 5

  const toggleItem = (index: number) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedItems(newExpanded)
  }

  const handleLoadMore = () => {
    setShowAll(true)
  }

  return (
    <motion.div
      className="max-w-4xl mx-auto"
      variants={containerVariants}
      initial="offscreen"
      whileInView="onscreen"
      viewport={{ once: true }}>
      <div className="space-y-4 x-4">
        {displayedFaqs.map((faq, index) => (
          <motion.div
            key={`${index}-${showAll}`}
            variants={itemVariants}
            initial="offscreen"
            animate="onscreen"
            transition={{
              delay: index * 0.1 + (showAll && index >= 5 ? 0.3 : 0),
            }}>
            <Disclosure
              as="div"
              className="bg-product-background rounded-xl border border-product-border w-full shadow-product-shadow">
              {({ open }) => (
                <>
                  <DisclosureButton
                    className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-product-hover-background transition-all duration-200 group"
                    onClick={() => toggleItem(index)}>
                    <span className="text-lg font-semibold text-product-foreground group-hover:text-product-primary transition-colors duration-200">
                      {faq.question}
                    </span>
                    <div className="flex-shrink-0 ml-4">
                      {expandedItems.has(index) ? (
                        <FiMinus className="w-5 h-5 text-product-primary transition-transform duration-200" />
                      ) : (
                        <FiPlus className="w-5 h-5 text-product-foreground-accent group-hover:text-product-primary transition-transform duration-200" />
                      )}
                    </div>
                  </DisclosureButton>
                  <DisclosurePanel className="px-6 pb-4">
                    <div className="animate-fadeIn">
                      <p className="text-product-foreground-accent leading-relaxed">{faq.answer}</p>
                    </div>
                  </DisclosurePanel>
                </>
              )}
            </Disclosure>
          </motion.div>
        ))}
      </div>

      {hasMore && !showAll && (
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}>
          <button
            onClick={handleLoadMore}
            className="px-8 py-3 bg-product-primary text-product-foreground rounded-lg font-semibold hover:bg-product-primary-accent transition-all duration-200 hover:scale-105 shadow-product-shadow">
            Load More Questions
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}

export default FAQ
