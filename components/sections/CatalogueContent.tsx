"use client"
import { useMainContext } from "@/context/MainContext"
import {
  contentVariants,
  generateUniqueSlug,
  getCurrencySymbol,
  getGridStyle,
} from "@/helpers/client"
import { CatalogueContentProps } from "@/types/components"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"
import "swiper/css"
import "swiper/css/pagination"
import { Swiper, SwiperSlide } from "swiper/react"
import CardsSwitcher from "../cards"
import SectionHeader from "./SectionHeader"

const CatalogueContent = ({ data, currency, type, theme }: CatalogueContentProps) => {
  const { layout } = useMainContext()
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!data || data.length === 0) return
    const initialExpanded = data.reduce(
      (acc, item, idx) => {
        const slug = generateUniqueSlug(item.name)
        acc[slug] = type === "demo" || idx === 0
        return acc
      },
      {} as Record<string, boolean>
    )
    setExpandedSections(initialExpanded)
  }, [data, type])

  const handleToggleSection = (slug: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [slug]: !prev[slug],
    }))
  }

  if (!data || !Array.isArray(data)) {
    console.warn("No data, rendering null")
    return (
      <main className="max-w-6xl mx-auto px-4 py-4" role="main" aria-label="Services content">
        <div
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center"
          role="alert"
          aria-live="polite">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">No Services Available</h2>
          <p className="text-yellow-700">No service data has been loaded yet.</p>
        </div>
      </main>
    )
  }

  if (data.length === 0) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-4" role="main" aria-label="Services content">
        <div
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center"
          role="alert"
          aria-live="polite">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">No Categories</h2>
          <p className="text-yellow-700">No service categories were found in the data.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-6xl mx-auto py-5 px-4" role="main" aria-label="Categories and items">
      {data.map((item, index) => {
        const currentLayout = type === "demo" ? layout : item.layout
        const slug = generateUniqueSlug(item.name)
        const isExpanded = expandedSections[slug]

        if (!item.items || !Array.isArray(item.items)) {
          return (
            <section key={slug} className="mb-5" id={slug}>
              <SectionHeader
                title={item.name}
                code={slug}
                isExpanded={isExpanded}
                onToggle={handleToggleSection}
              />
              <div
                className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4"
                role="alert"
                aria-live="polite">
                <p className="text-red-700 text-sm">Invalid data for this section</p>
              </div>
            </section>
          )
        }

        return (
          <section key={slug} className="mb-5" id={slug}>
            <SectionHeader
              title={item.name}
              code={slug}
              isExpanded={isExpanded}
              onToggle={handleToggleSection}
            />

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  key="content"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                  role="region"
                  aria-label={`${item.name} items`}>
                  {currentLayout === "variant_4" ? (
                    <Swiper
                      spaceBetween={12}
                      slidesPerView="auto"
                      className="mt-4 px-0 sm:px-2 py-2"
                      role="region"
                      aria-label={`${item.name} carousel`}>
                      {item.items.map((record, i) => (
                        <SwiperSlide
                          key={i}
                          className="!w-[160px] sm:!w-[220px] md:!w-[260px] lg:!w-[320px] py-2 flex-shrink-0 flex flex-col !h-auto"
                          role="group"
                          aria-label={`Item ${i + 1} of ${item.items.length}`}>
                          <CardsSwitcher
                            variant={currentLayout}
                            record={record}
                            currency={getCurrencySymbol(currency)}
                            i={i}
                            theme={theme}
                          />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  ) : (
                    <div
                      className={getGridStyle(currentLayout)}
                      role="grid"
                      aria-label={`${item.name} items grid`}>
                      {item.items.map((record, i) => (
                        <CardsSwitcher
                          key={i}
                          variant={currentLayout}
                          record={record}
                          currency={getCurrencySymbol(currency)}
                          i={i}
                          theme={theme}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        )
      })}
    </main>
  )
}

export default CatalogueContent
