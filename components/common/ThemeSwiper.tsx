"use client"
import { Button } from "@/components/ui/button"
import { themes } from "@/constants"
import { useMainContext } from "@/context/MainContext"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"

const ThemeSwiper = ({ type = "home" }: { type?: string }) => {
  const context = useMainContext()
  if (!context) return null
  const { setLayout, layout, theme, setTheme } = context
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeLayoutIndex, setActiveLayoutIndex] = useState(0)

  // Find current theme index
  useEffect(() => {
    const currentIndex = themes.findIndex(t => t.key === theme)
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex)
    }
  }, [theme])

  // Find current layout index
  useEffect(() => {
    const currentIndex = [
      { key: "variant_1", label: "Side Image" },
      { key: "variant_2", label: "Top Image" },
      { key: "variant_3", label: "Text Only" },
      { key: "variant_4", label: "Carousel" },
    ].findIndex(l => l.key === layout)
    if (currentIndex !== -1) {
      setActiveLayoutIndex(currentIndex)
    }
  }, [layout])

  const handleThemeChange = (themeKey: string) => {
    setTheme(themeKey)
  }

  const handlePreviousTheme = () => {
    const currentIndex = themes.findIndex(t => t.key === theme)
    const newIndex = currentIndex > 0 ? currentIndex - 1 : themes.length - 1
    setActiveIndex(newIndex)
    setTheme(themes[newIndex].key)
  }

  const handleNextTheme = () => {
    const currentIndex = themes.findIndex(t => t.key === theme)
    const newIndex = currentIndex < themes.length - 1 ? currentIndex + 1 : 0
    setActiveIndex(newIndex)
    setTheme(themes[newIndex].key)
  }

  const handlePreviousLayout = () => {
    const layouts = [
      { key: "variant_1", label: "Side Image" },
      { key: "variant_2", label: "Top Image" },
      { key: "variant_3", label: "Text Only" },
      { key: "variant_4", label: "Carousel" },
    ]
    const currentIndex = layouts.findIndex(l => l.key === layout)
    const newIndex = currentIndex > 0 ? currentIndex - 1 : layouts.length - 1
    setActiveLayoutIndex(newIndex)
    setLayout(layouts[newIndex].key)
  }

  const handleNextLayout = () => {
    const layouts = [
      { key: "variant_1", label: "Side Image" },
      { key: "variant_2", label: "Top Image" },
      { key: "variant_3", label: "Text Only" },
      { key: "variant_4", label: "Carousel" },
    ]
    const currentIndex = layouts.findIndex(l => l.key === layout)
    const newIndex = currentIndex < layouts.length - 1 ? currentIndex + 1 : 0
    setActiveLayoutIndex(newIndex)
    setLayout(layouts[newIndex].key)
  }

  return (
    <div className="flex flex-col justify-center items-center gap-8 w-full max-w-5xl mx-auto px-4">
      {/* Layout Section */}
      {type === "home" && (
        <div className="flex flex-col items-center gap-6 w-full">
          <h3
            className="text-xl font-semibold text-center"
            style={{
              color: "var(--section-heading)",
              fontFamily: "var(--font-family-heading)",
              fontWeight: "var(--font-weight-heading)",
              letterSpacing: "var(--letter-spacing-heading)",
            }}>
            Choose Layout Style
          </h3>
          
          <div className="w-full max-w-2xl lg:max-w-sm">
            {/* Navigation Arrows with Layout Info */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-section-bg shadow-product-shadow border border-section-border mb-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePreviousLayout}
                className="w-10 h-10 p-0 rounded-full border-2 hover:scale-105 transition-all duration-200"
                style={{
                  borderColor: "var(--section-border)",
                  backgroundColor: "var(--background)",
                  color: "var(--foreground)",
                }}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="text-center">
                <div 
                  className="text-base font-medium"
                  style={{
                    color: "var(--heading)",
                    fontFamily: "var(--font-family-heading)",
                    fontWeight: "var(--font-weight-heading)",
                  }}>
                  {[
                    { key: "variant_1", label: "Side Image" },
                    { key: "variant_2", label: "Top Image" },
                    { key: "variant_3", label: "Text Only" },
                    { key: "variant_4", label: "Carousel" },
                  ][activeLayoutIndex]?.label || "Side Image"}
                </div>
              </div>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleNextLayout}
                className="w-10 h-10 p-0 rounded-full border-2 hover:scale-105 transition-all duration-200"
                style={{
                  borderColor: "var(--section-border)",
                  backgroundColor: "var(--background)",
                  color: "var(--foreground)",
                }}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Theme Section with Swiper */}
      <div className="flex flex-col items-center gap-6 w-full">
        <h3
          className="text-xl font-semibold text-center"
          style={{
            color: "var(--section-heading)",
            fontFamily: "var(--font-family-heading)",
            fontWeight: "var(--font-weight-heading)",
            letterSpacing: "var(--letter-spacing-heading)",
          }}>
          Choose Color Theme
        </h3>
        
        <div className="w-full max-w-2xl lg:max-w-sm">
          {/* Navigation Arrows with Theme Info */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-section-bg shadow-product-shadow border border-section-border mb-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePreviousTheme}
              className="w-10 h-10 p-0 rounded-full border-2 hover:scale-105 transition-all duration-200"
              style={{
                borderColor: "var(--section-border)",
                backgroundColor: "var(--background)",
                color: "var(--foreground)",
              }}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-3">
              {/* Theme Color Circle */}
              <div 
                className="w-6 h-6 rounded-full border-2 flex-shrink-0"
                style={{
                  backgroundColor: themes[activeIndex] ? `var(--primary, #3b82f6)` : '#3b82f6',
                  borderColor: "var(--foreground)"
                }}></div>
              
              <div className="text-center">
                <div 
                  className="text-base font-medium"
                  style={{
                    color: "var(--heading)",
                    fontFamily: "var(--font-family-heading)",
                    fontWeight: "var(--font-weight-heading)",
                  }}>
                  {themes[activeIndex]?.label || "Elegant"}
                </div>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleNextTheme}
              className="w-10 h-10 p-0 rounded-full border-2 hover:scale-105 transition-all duration-200"
              style={{
                borderColor: "var(--section-border)",
                backgroundColor: "var(--background)",
                color: "var(--foreground)",
              }}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThemeSwiper

