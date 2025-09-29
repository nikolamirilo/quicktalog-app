// @ts-nocheck
"use client"
import Toggle from "@/components/common/Toggle"
import Footer from "@/components/navigation/Footer"
import Navbar from "@/components/navigation/Navbar"
import ServicesSection from "@/components/sections/ServicesSection"
import { useMainContext } from "@/context/MainContext"
import data from "../../showcase.json"

const page: React.FC = () => {
  const { theme } = useMainContext()

  try {
    if (!data) {
      throw new Error("Catalogue data is not available")
    }

    if (!data.services || typeof data.services !== "object") {
      throw new Error("Invalid services data structure")
    }

    return (
      <>
        <Navbar />
        <div
          className={`min-h-screen text-text bg-background font-lora ${theme ? theme : "theme-luxury"}`}>
          <main>
            <section className="w-full bg-background pt-36 px-4 text-center flex flex-col items-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl max-w-[800px] font-lora font-semibold text-foreground tracking-tight mb-4">
                Welcome to Quicktalog Demo!
              </h1>
              <div className="w-60 h-[3px] bg-foreground mb-6 rounded-full"></div>
              <p className="text-lg sm:text-xl text-heading max-w-2xl font-lora leading-relaxed mb-6">
                Customize the look and feel by switching between different layouts and visual
                themes. Whether you prefer bold and modern or soft and elegant, explore how our
                Catalogue adapts to match your brand's unique vibe.
              </p>
            </section>

            <div className="flex flex-col justify-center items-center w-full mt-6">
              <Toggle />
            </div>

            {data && (
              <ServicesSection
                servicesData={data.services}
                currency={data.currency}
                type="demo"
                theme={theme}
              />
            )}
            
            {/* Fixed Bottom Create Catalogue CTA */}
            <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-product-background border-t border-product-border">
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-center sm:text-left">
                    <p className="text-sm text-product-foreground font-medium">
                      Ready to create your own catalogue?
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href="/auth?mode=signup"
                      className="bg-product-primary text-product-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-product-primary-accent transition-colors duration-200 shadow-product-shadow"
                    >
                      Get Started
                    </a>
                    <a
                      href="/pricing"
                      className="text-product-secondary border border-product-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-product-primary hover:text-product-foreground transition-all duration-200"
                    >
                      Pricing
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            <Footer />
          </main>
        </div>
      </>
    )
  } catch (error) {
    console.error("Demo page error:", error)

    return (
      <>
        <Navbar />
        <div className="min-h-screen text-text bg-background font-lora theme-luxury">
          <main>
            <section className="w-full bg-background pt-36 px-4 text-center flex flex-col items-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl">
                <h1 className="text-2xl font-bold text-red-800 mb-4">Demo Error</h1>
                <p className="text-red-700 mb-4">
                  {error instanceof Error
                    ? error.message
                    : "An unexpected error occurred while loading the demo."}
                </p>
                <div className="text-sm text-red-600">
                  <p>Please check:</p>
                  <ul className="list-disc list-inside mt-2">
                    <li>Catalogue data file is valid</li>
                    <li>Services data structure is correct</li>
                    <li>Try refreshing the page</li>
                  </ul>
                </div>
              </div>
            </section>
            <Footer />
          </main>
        </div>
      </>
    )
  }
}

export default page
