"use client"
import BrowserFrame from "@/components/common/BrowserFrame"
import ServicesSection from "@/components/sections/ServicesSection"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { themes } from "@/constants"
import { useMainContext } from "@/context/MainContext"
import { toTitleCase } from "@/helpers/client"
import type { Step5AppearanceProps } from "@/types/components"
import * as React from "react"
import { PiPaintBrushDuotone } from "react-icons/pi"
import { TbChevronLeft, TbChevronRight } from "react-icons/tb"
import type { Swiper as SwiperType } from "swiper"
import "swiper/css"
import "swiper/css/navigation"
import { Navigation, Pagination } from "swiper/modules"
import { Swiper, SwiperSlide } from "swiper/react"

const Step5Appearance: React.FC<Step5AppearanceProps> = ({ formData, setFormData }) => {
  const { theme, setTheme } = useMainContext()
  const [swiperInstance, setSwiperInstance] = React.useState<SwiperType | null>(null)
  const item = formData

  const handleThemeChange = (value: string) => {
    setFormData((prev: any) => ({ ...prev, theme: value }))
  }

  const currentThemeIndex = themes.findIndex((themeItem) => themeItem.key === theme)

  const handleSlideChange = (swiper: SwiperType) => {
    const activeIndex = swiper.activeIndex
    if (themes[activeIndex]) {
      setTheme(themes[activeIndex].key)
      handleThemeChange(themes[activeIndex].key)
    }
  }

  const goToPrevious = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (swiperInstance) {
      if (swiperInstance.activeIndex === 0) {
        // if on the first slide, go to last
        swiperInstance.slideTo(themes.length - 1)
      } else {
        swiperInstance.slidePrev()
      }
    }
  }

  const goToNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (swiperInstance) {
      if (swiperInstance.activeIndex >= themes.length - 1) {
        swiperInstance.slideTo(0)
      } else {
        swiperInstance.slideNext()
      }
    }
  }

  React.useEffect(() => {
    if (formData.theme && formData.theme != "") {
      setTheme(formData.theme)
    }
  }, [])

  return (
    <>
      <Card
        className="space-y-8 p-4 sm:p-4 bg-product-background/95 border-0 border-product-border shadow-product-shadow rounded-2xl"
        type="form">
        <h2 className="text-2xl sm:text-3xl font-bold text-product-foreground flex items-center gap-3 font-heading">
          <PiPaintBrushDuotone className="text-product-primary" size={32} />
          Appearance
        </h2>
        <div className="flex flex-col gap-3 mt-5">
          <Label htmlFor="currtheme-inputency" className="text-product-foreground text-lg">
            Select Theme<span className="text-red-500 ml-1">*</span>
          </Label>
          <div
            className="flex flex-row justify-center align-middle items-center relative flex-center gap-5 md:gap-10"
            id="theme-input">
            <button
              onClick={goToPrevious}
              className="z-10 bg-product-primary  shadow-lg rounded-full p-3 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous theme">
              <TbChevronLeft size={24} className="text-white" />
            </button>
            <p id="theme">{toTitleCase(theme.split("-").join(" "))}</p>
            <button
              onClick={goToNext}
              className="z-10 bg-product-primary  shadow-lg rounded-full p-3 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next theme">
              <TbChevronRight size={24} className="text-white" />
            </button>
          </div>
        </div>
        {/* Preview Container with Navigation */}
        <div className="relative flex flex-col gap-3 w-full">
          {/* Swiper Container */}
          <h3 className="text-xl sm:text-2xl text-product-foreground flex items-center gap-3 font-bold w-full mx-auto justify-center">
            Preview
          </h3>
          <BrowserFrame url={`${process.env.NEXT_PUBLIC_BASE_URL}/catalogues/${formData.name}`}>
            <Swiper
              modules={[Navigation, Pagination]}
              spaceBetween={0}
              slidesPerView={1}
              initialSlide={currentThemeIndex >= 0 ? currentThemeIndex : 0}
              onSwiper={setSwiperInstance}
              onSlideChange={handleSlideChange}
              className="overflow-hidden">
              {themes.map((themeItem, index) => (
                <SwiperSlide key={themeItem.key}>
                  <div
                    className={`${item.theme || "theme-elegant"} bg-background text-foreground min-h-screen flex flex-col`}
                    role="application"
                    aria-label={`${item.title} Catalogue`}>
                    <main
                      className="flex-1 flex flex-col min-h-0"
                      role="main"
                      aria-label="Service catalogue content">
                      <section
                        className="flex flex-col justify-start items-center text-center px-4 pt-8 sm:pt-12 md:pt-16 flex-shrink-0"
                        aria-labelledby="catalogue-title">
                        <div className="max-w-4xl mx-auto">
                          <h1
                            id="catalogue-title"
                            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-lora font-semibold text-heading drop-shadow-sm mb-4">
                            {item.title}
                          </h1>
                          {item.subtitle && (
                            <p
                              className="text-text text-base sm:text-lg md:text-xl lg:text-2xl px-5 max-w-[900px] font-lora font-normal leading-relaxed"
                              aria-describedby="catalogue-title">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </section>

                      {/* Services Section */}
                      <section
                        className="flex-1 w-full max-w-7xl mx-auto lg:px-8 pt-8 sm:pt-12 md:pt-16 pb-8 min-h-[60vh]"
                        aria-label="Services and items">
                        <ServicesSection
                          servicesData={item.services}
                          currency={item.currency}
                          type="item"
                          theme={item.theme}
                        />
                      </section>
                    </main>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </BrowserFrame>
          <p className="mt-5 p-6">
            <b>Selected Theme:</b> {toTitleCase(theme.split("-").join(" "))}
          </p>
        </div>
      </Card>
    </>
  )
}

export default Step5Appearance
