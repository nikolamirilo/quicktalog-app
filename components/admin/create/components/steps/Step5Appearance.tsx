"use client"
import BrowserFrame from "@/components/common/BrowserFrame"
import InformModal from "@/components/modals/InformModal"
import ServicesSection from "@/components/sections/ServicesSection"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { themes } from "@/constants"
import { useMainContext } from "@/context/MainContext"
import type { Step5AppearanceProps } from "@/types/components"
import * as React from "react"
import { FiInfo } from "react-icons/fi"
import { MdDesktopMac, MdPhoneAndroid } from "react-icons/md"
import { PiPaintBrushDuotone } from "react-icons/pi"
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
        <div className="relative flex flex-col gap-4 w-full">
          {/* Enhanced Control Panel */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            {/* Control Panel Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <PiPaintBrushDuotone className="text-product-primary" size={16} />
                Customize Preview
              </h4>
            </div>
            
            {/* Control Panel Content */}
            <div className="p-4">
              <div className="space-y-4">
                {/* Theme Section Title */}
                <div className="text-center">
                  <h5 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Theme
                  </h5>
                </div>
                
                {/* Clickable Theme Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {themes.map((themeItem, index) => (
                    <button
                      key={themeItem.key}
                      type="button"
                      onClick={() => {
                        setTheme(themeItem.key)
                        handleThemeChange(themeItem.key)
                        if (swiperInstance) {
                          swiperInstance.slideTo(index)
                        }
                      }}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 hover:scale-[1.02] ${themeItem.key} ${
                        theme === themeItem.key
                          ? 'border-product-primary shadow-md'
                          : 'hover:shadow-sm'
                      }`}
                      style={{
                        borderColor: theme === themeItem.key ? 'var(--product-primary)' : 'var(--section-border)',
                        backgroundColor: 'var(--background)',
                        color: 'var(--foreground)',
                        fontFamily: 'var(--font-family-body)'
                      }}>
                      <div className="text-center">
                        <div 
                          className="w-8 h-8 mx-auto mb-2 rounded-full border-2"
                          style={{
                            backgroundColor: 'var(--primary)',
                            borderColor: 'var(--foreground)'
                          }}></div>
                        <div 
                          className="text-xs font-medium" 
                          style={{ 
                            color: 'var(--heading)',
                            fontFamily: 'var(--font-family-heading)',
                            fontWeight: 'var(--font-weight-heading)',
                            letterSpacing: 'var(--letter-spacing-heading)'
                          }}>
                          {themeItem.label}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Swiper Container */}
          <h3 className="text-xl sm:text-2xl text-product-foreground flex items-center gap-3 font-bold w-full mx-auto justify-center">
            Preview {isMobileView ? 'Mobile' : 'Desktop'}
          </h3>
          <BrowserFrame 
            url={`${process.env.NEXT_PUBLIC_BASE_URL}/catalogues/${formData.name}`}
            isMobileView={isMobileView}
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
                        className={`flex-1 w-full max-w-7xl mx-auto pt-8 pb-8 min-h-[60vh] ${isMobileView ? 'px-0 sm:px-0 md:px-0 lg:px-0' : 'lg:px-8 sm:pt-12 md:pt-16'}`}
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
        </div>
      </Card>

      <InformModal
        isOpen={isInfoModalOpen}
        onConfirm={() => setIsInfoModalOpen(false)}
        onCancel={() => setIsInfoModalOpen(false)}
        title="Theme Selection Explained"
        message="Click on any theme button above to instantly preview your catalogue with that theme's styling. Each theme button shows you the actual colors, fonts, and visual style that will be applied to your catalogue. You can also swipe through themes in the preview window below."
        confirmText="Got it!"
        cancelText=""
      />
    </>
  )
}

export default Step5Appearance
