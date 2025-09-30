"use client"
import BrowserFrame from "@/components/common/BrowserFrame"
import InformModal from "@/components/modals/InformModal"
import ServicesSection from "@/components/sections/ServicesSection"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { themes } from "@/constants"
import { useMainContext } from "@/context/MainContext"
import { toTitleCase } from "@/helpers/client"
import type { Step5AppearanceProps } from "@/types/components"
import * as React from "react"
import { FiInfo } from "react-icons/fi"
import { MdDesktopMac, MdPhoneAndroid } from "react-icons/md"
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
  const [isInfoModalOpen, setIsInfoModalOpen] = React.useState(false)
  const [isMobileView, setIsMobileView] = React.useState(false)
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
          <div className="flex items-center gap-2">
            <Label htmlFor="currtheme-inputency" className="text-product-foreground text-lg">
              Select Theme<span className="text-red-500 ml-1">*</span>
            </Label>
            <button
              type="button"
              onClick={() => setIsInfoModalOpen(true)}
              className="hover:text-product-primary transition-colors duration-200 z-10">
              <FiInfo size={16} />
            </button>
          </div>
        </div>
        {/* Preview Container with Navigation */}
        <div className="relative flex flex-col gap-3 w-full">
          {/* Swiper Container */}
          <h3 className="text-xl sm:text-2xl text-product-foreground flex items-center gap-3 font-bold w-full mx-auto justify-center">
            Preview {isMobileView ? 'Mobile' : 'Desktop'}
          </h3>
          <BrowserFrame 
            url={`${process.env.NEXT_PUBLIC_BASE_URL}/catalogues/${formData.name}`}
            isMobileView={isMobileView}
            floatingControls={
              <div className={`flex items-center bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg ${isMobileView ? 'gap-2 px-2 py-1' : 'gap-4 px-4 py-2'}`}>
                <button
                  onClick={goToPrevious}
                  className={`bg-product-primary shadow-lg rounded-full transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${isMobileView ? 'p-1' : 'p-2'}`}
                  aria-label="Previous theme">
                  <TbChevronLeft size={isMobileView ? 16 : 20} className="text-white" />
                </button>
                <div className={`flex flex-col items-center ${isMobileView ? 'min-w-0 flex-shrink' : ''}`}>
                  <span className={`font-medium text-gray-700 ${isMobileView ? 'text-xs px-1' : 'text-sm px-2'}`}>
                    {toTitleCase(theme.split("-").join(" "))}
                  </span>
                  <span className={`text-gray-500 ${isMobileView ? 'text-xs' : 'text-xs'}`}>
                    Theme {currentThemeIndex + 1} of {themes.length}
                  </span>
                </div>
                <button
                  onClick={goToNext}
                  className={`bg-product-primary shadow-lg rounded-full transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${isMobileView ? 'p-1' : 'p-2'}`}
                  aria-label="Next theme">
                  <TbChevronRight size={isMobileView ? 16 : 20} className="text-white" />
                </button>
              </div>
            }
            mobileToggle={
              <button
                type="button"
                onClick={() => setIsMobileView(!isMobileView)}
                className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full p-2 shadow-lg hover:bg-white transition-all duration-300 ease-in-out hover:scale-105"
                aria-label={isMobileView ? "Switch to desktop view" : "Switch to mobile view"}>
                <div className="transition-all duration-300 ease-in-out">
                  {isMobileView ? <MdDesktopMac size={20} className="text-gray-700" /> : <MdPhoneAndroid size={20} className="text-gray-700" />}
                </div>
              </button>
            }
          >
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
                    className={`${item.theme || "theme-elegant"} bg-background text-foreground min-h-screen flex flex-col ${isMobileView ? 'mobile-preview' : ''}`}
                    role="application"
                    aria-label={`${item.title} Catalogue`}>
                    <main
                      className="flex-1 flex flex-col min-h-0"
                      role="main"
                      aria-label="Service catalogue content">
                      <section
                        className={`flex flex-col justify-start items-center text-center px-4 pt-8 flex-shrink-0 ${isMobileView ? 'sm:pt-8 md:pt-8 lg:pt-8' : 'sm:pt-12 md:pt-16'}`}
                        aria-labelledby="catalogue-title">
                        <div className="max-w-4xl mx-auto">
                          <h1
                            id="catalogue-title"
                            className={`font-lora font-semibold text-heading drop-shadow-sm mb-4 ${isMobileView ? 'text-2xl sm:text-2xl md:text-2xl lg:text-2xl' : 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl'}`}>
                            {item.title}
                          </h1>
                          {item.subtitle && (
                            <p
                              className={`text-text font-lora font-normal leading-relaxed ${isMobileView ? 'text-base sm:text-base md:text-base lg:text-base px-2' : 'text-base sm:text-lg md:text-xl lg:text-2xl px-5'} max-w-[900px]`}
                              aria-describedby="catalogue-title">
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                      </section>

                      {/* Services Section */}
                      <section
                        className={`flex-1 w-full max-w-7xl mx-auto pt-8 pb-8 min-h-[60vh] ${isMobileView ? 'px-2 sm:px-2 md:px-2 lg:px-2' : 'lg:px-8 sm:pt-12 md:pt-16'}`}
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
          <div className="mt-6 flex justify-center">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-6 py-3">
              <div className="text-center">
                <div className="text-gray-600 text-sm mb-1">Selected Theme</div>
                <div className="text-gray-900 text-lg font-medium">
                  {toTitleCase(theme.split("-").join(" "))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <InformModal
        isOpen={isInfoModalOpen}
        onConfirm={() => setIsInfoModalOpen(false)}
        onCancel={() => setIsInfoModalOpen(false)}
        title="Theme Selection Explained"
        message="Click the arrows or swipe through our themes to preview your catalogue. Each theme offers a unique visual style, colors, and typography for your digital catalogue, allowing you to choose the perfect look that matches your brand."
        confirmText="Got it!"
        cancelText=""
      />
    </>
  )
}

export default Step5Appearance
