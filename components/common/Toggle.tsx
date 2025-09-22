"use client"
import { layouts, themes } from "@/constants"
import { useMainContext } from "@/context/MainContext"
import { Button } from "../ui/button"

const Toggle = () => {
  const context = useMainContext()
  if (!context) return null
  const { setLayout, layout, theme, setTheme } = context

  return (
    <div className="flex flex-col justify-center items-center gap-6 w-full max-w-4xl mx-auto px-4">
      {/* Layout Section */}
      <div className="flex flex-col items-center gap-4 w-full">
        <h3
          className="text-lg font-semibold"
          style={{
            color: "var(--section-heading)",
            fontFamily: "var(--font-family-heading)",
            fontWeight: "var(--font-weight-heading)",
            letterSpacing: "var(--letter-spacing-heading)",
          }}>
          Pick Layout
        </h3>
        <div className="w-full max-w-md">
          <div
            className="inline-flex rounded-2xl bg-section-bg p-1.5 shadow-product-shadow border border-section-border gap-1 w-full"
            role="group">
            {layouts.map((layoutOption) => (
              <Button
                key={layoutOption.key}
                type="button"
                variant="ghost"
                size="sm"
                className={`
                  relative flex-1 px-3 sm:px-4 py-2.5 text-xs sm:text-sm transition-all duration-300 ease-out
                  ${
                    layout === layoutOption.key
                      ? "shadow-product-hover-shadow scale-105 transform font-semibold"
                      : ""
                  }
                  rounded-xl
                  hover:shadow-md hover:scale-102 transform
                  active:scale-95
                  backdrop-blur-sm
                  min-w-0
                `}
                style={{
                  backgroundColor: layout === layoutOption.key ? "var(--primary)" : "transparent",
                  color:
                    layout === layoutOption.key
                      ? "var(--primary-foreground)"
                      : "var(--section-heading)",
                  fontFamily: "var(--font-family-body)",
                  fontWeight:
                    layout === layoutOption.key
                      ? "var(--font-weight-heading)"
                      : "var(--font-weight-body)",
                  letterSpacing: "var(--letter-spacing-body)",
                }}
                onClick={() => setLayout(layoutOption.key)}>
                <span className="relative z-10 truncate">{layoutOption.label}</span>
                {layout === layoutOption.key && (
                  <div
                    className="absolute inset-0 rounded-xl opacity-20 blur-sm"
                    style={{ backgroundColor: "var(--primary)" }}
                  />
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Theme Section */}
      <div className="flex flex-col items-center gap-4 w-full">
        <h3
          className="text-lg font-semibold"
          style={{
            color: "var(--section-heading)",
            fontFamily: "var(--font-family-heading)",
            fontWeight: "var(--font-weight-heading)",
            letterSpacing: "var(--letter-spacing-heading)",
          }}>
          Pick Theme
        </h3>
        <div className="w-full max-w-md">
          <div
            className="inline-flex rounded-2xl bg-section-bg p-1.5 shadow-product-shadow border border-section-border gap-1 w-full flex-wrap sm:flex-nowrap"
            role="group">
            {themes.map((themeOption) => (
              <Button
                key={themeOption.key}
                type="button"
                variant="ghost"
                size="sm"
                className={`
                  relative flex-1 px-2 sm:px-3 py-2.5 text-xs sm:text-sm transition-all duration-300 ease-out
                  ${
                    theme === themeOption.key
                      ? "shadow-product-hover-shadow scale-105 transform font-semibold"
                      : ""
                  }
                  rounded-xl
                  hover:shadow-md hover:scale-102 transform
                  active:scale-95
                  backdrop-blur-sm
                  min-w-0
                  whitespace-nowrap
                `}
                style={{
                  backgroundColor: theme === themeOption.key ? "var(--primary)" : "transparent",
                  color:
                    theme === themeOption.key
                      ? "var(--primary-foreground)"
                      : "var(--section-heading)",
                  fontFamily: "var(--font-family-body)",
                  fontWeight:
                    theme === themeOption.key
                      ? "var(--font-weight-heading)"
                      : "var(--font-weight-body)",
                  letterSpacing: "var(--letter-spacing-body)",
                }}
                onClick={() => setTheme(themeOption.key)}>
                <span className="relative z-10 truncate">{themeOption.label}</span>
                {theme === themeOption.key && (
                  <div
                    className="absolute inset-0 rounded-xl opacity-20 blur-sm"
                    style={{ backgroundColor: "var(--primary)" }}
                  />
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Toggle
