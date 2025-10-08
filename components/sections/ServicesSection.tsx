// @ts-nocheck
"use client"
import { useMainContext } from "@/context/MainContext"
import { contentVariants, getCurrencySymbol, getGridStyle } from "@/helpers/client"
import { ServicesCategory } from "@/types"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"
import "swiper/css"
import "swiper/css/pagination"
import { Swiper, SwiperSlide } from "swiper/react"
import CardsSwitcher from "../cards"
import SectionHeader from "./SectionHeader"

interface ProcessedSection {
  title: string
  code: string
  order: number
  layout: string
  items: any[]
}

interface ServicesSectionProps {
  servicesData: ServicesCategory[]
  currency: string
  type: "demo" | "item"
  theme?: string
}

const processSectionsData = (servicesData: ServiceItem[]): ProcessedSection[] => {
  if (!servicesData || !Array.isArray(servicesData)) {
    console.warn("ServicesSection: No servicesData provided or not an array")
    return []
  }

  try {
    const processed = servicesData
      .filter((item) => item.items.length > 0 && item.name != "" && item.name != null)
      .map((item) => {
        return {
          title: item.name,
          code: item.name.toLowerCase().split(" ").join("-"),
          order: item.order != null ? Number(item.order) : 999,
          layout: item.layout,
          items: item.items,
        }
      })

    const sorted = processed.sort((a, b) => {
      const result = a.order - b.order

      return result
    })
    return sorted
  } catch (error) {
    console.error("ServicesSection: Error processing sections data:", error)
    return []
  }
}

const ServicesSection = ({ servicesData, currency, type, theme }: ServicesSectionProps) => {
  const { layout } = useMainContext()
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean
  }>({})

  const sectionsData = processSectionsData(servicesData)

  useEffect(() => {
    if (sectionsData.length > 0 && type === "demo") {
      const initialExpanded = sectionsData.reduce(
        (acc, item) => {
          acc[item.code] = true
          return acc
        },
        {} as { [key: string]: boolean }
      )
      setExpandedSections(initialExpanded)
    }
  }, [sectionsData.length, type])

  const handleToggleSection = (code: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [code]: !prev[code],
    }))
  }

  if (!servicesData || !Array.isArray(servicesData)) {
    console.warn("ServicesSection: No servicesData, rendering null")
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

  if (sectionsData.length === 0) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-4" role="main" aria-label="Services content">
        <div
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center"
          role="alert"
          aria-live="polite">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">No Service Categories</h2>
          <p className="text-yellow-700">No service categories were found in the data.</p>
        </div>
      </main>
    )
  }

  return (
    <main className={`max-w-6xl mx-auto py-5 px-4 `} role="main" aria-label="Services and items">
      {sectionsData.map((item) => {
        const currentLayout = type === "demo" ? layout : item.layout
        if (!item.items || !Array.isArray(item.items)) {
          console.error(`ServicesSection: Invalid data for section ${item.code}:`, item)
          return (
            <section
              key={item.code}
              className="mb-5"
              id={item.code}
              aria-labelledby={`section-header-${item.code}`}>
              <SectionHeader
                title={item.title}
                code={item.code}
                isExpanded={!!expandedSections[item.code]}
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
          <section
            key={item.code}
            className="mb-5"
            id={item.code}
            aria-labelledby={`section-header-${item.code}`}>
            <SectionHeader
              title={item.title}
              code={item.code}
              isExpanded={!!expandedSections[item.code]}
              onToggle={handleToggleSection}
            />

            <AnimatePresence initial={false}>
              {expandedSections[item.code] && (
                <motion.div
                  id={`section-content-${item.code}`}
                  key="content"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                  role="region"
                  aria-label={`${item.title} items`}
                  aria-live="polite">
                  {currentLayout === "variant_4" ? (
                    <Swiper
                      spaceBetween={12}
                      slidesPerView={"auto"}
                      className="mt-4 px-0 sm:px-2 py-2"
                      role="region"
                      aria-label={`${item.title} carousel`}>
                      {item.items.map((record: any, i: number) => (
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
                      aria-label={`${item.title} items grid`}>
                      {item.items.map((record: any, i: number) => (
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

export default ServicesSection
