// components/admin/dashboard/Dashboard.tsx
"use client"
import Loader from "@/components/navigation/Loader"
import { Button } from "@/components/ui/button"
import { useDashboardData } from "@/hooks/useDashboardData"
import { DashboardProps } from "@/types/components"
import { Suspense, lazy, useState } from "react"
import Overview from "./Overview"

const Subscription = lazy(() => import("./Subscription"))
const MonthlyUsage = lazy(() => import("./MonthlyUsage"))
const Settings = lazy(() => import("./Settings"))
const Support = lazy(() => import("./Support"))
const MobileTabBar = lazy(() => import("@/components/navigation/MobileTabBar"))
const SidebarContent = lazy(() => import("@/components/navigation/SidebarContent"))

// Updated interface without required catalogues and overallAnalytics
interface ImprovedDashboardProps {
  user: DashboardProps["user"]
  usage: DashboardProps["usage"]
  pricingPlan: DashboardProps["pricingPlan"]
}

export default function Dashboard({ user, usage, pricingPlan }: ImprovedDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")

  // Fetch data only when needed based on active tab
  const { analytics, catalogues, loadingStates, refreshAll } = useDashboardData(activeTab)

  function getSidebarButtonClass(isActive: boolean) {
    return isActive
      ? "font-bold !bg-product-hover-background !text-navbar-button-active !border !border-product-primary shadow-sm hover:scale-[1.03] hover:transform"
      : "font-medium"
  }

  return (
    <div className="w-full min-h-screen px-4 sm:px-4 relative md:px-6 lg:px-8 pt-32 pb-12 bg-gradient-to-br from-product-background to-hero-product-background animate-fade-in">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-8">
        {/* Sidebar tabs (hidden on mobile) */}
        <Suspense fallback={<div className="w-64 h-96 bg-gray-100 animate-pulse rounded-lg" />}>
          <SidebarContent
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            getSidebarButtonClass={getSidebarButtonClass}
          />
        </Suspense>

        {/* Main Content Section */}
        <section className="flex-1 min-w-0 bg-product-background/95 border border-product-border shadow-md rounded-3xl p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 relative z-10 text-xs sm:text-sm md:text-base lg:text-lg">
          {/* Mobile tab bar */}
          <Suspense fallback={null}>
            <MobileTabBar activeTab={activeTab} setActiveTab={setActiveTab} />
          </Suspense>

          {activeTab === "overview" ? (
            <>
              {loadingStates.analytics || loadingStates.analytics ? (
                <div className="text-center py-8">
                  <Loader type="dashboard" />
                </div>
              ) : (
                <section className="animate-fade-in">
                     <div className="bg-gradient-to-r items-center justify-center from-product-primary/10 to-product-primary/5 border border-product-primary rounded-2xl p-6 gap-3 flex flex-col text-center mb-4">
                      <h2 className="text-xl font-semibold text-product-foreground">
                        🚀 Join Our Beta Community
                      </h2>
                      <p className="text-product-foreground-accen text-sm">
                        Be the first to shape the future of Quicktalog. Get priority support, early updates, and share your feedback
                        directly with our team in our Discord group. Open until December 31, 2025.
                      </p>
                      <div className="flex justify-center w-[50%]">
                      <Button variant="cta" asChild>
                        <a href="https://discord.gg/t6bdJQGG">Join on Discord</a>
                      </Button>
                      </div>
                  </div>
                  <Overview
                    user={user}
                    usage={usage}
                    overallAnalytics={{
                      ...analytics,
                      totalServiceCatalogues: catalogues?.length || 0,
                    }}
                    catalogues={catalogues || []}
                    refreshAll={refreshAll}
                    planId={pricingPlan.id}
                  />
                </section>
              )}
            </>
          ) : null}

          <Suspense
            fallback={
              <div className="text-center py-4">
                <Loader type="dashboard" />
              </div>
            }>
            {activeTab === "subscription" ? (
              <section className="animate-fade-in">
                <Subscription pricingPlan={pricingPlan} />
              </section>
            ) : null}

            {activeTab === "usage" ? (
              <section className="animate-fade-in">
                <MonthlyUsage data={usage} pricingPlan={pricingPlan} />
              </section>
            ) : null}

            {activeTab === "settings" ? (
              <section className="animate-fade-in">
                <Settings />
              </section>
            ) : null}

            {activeTab === "support" ? (
              <section className="animate-fade-in">
                <Support pricingPlanId={pricingPlan.id} userEmail={user.email} />
              </section>
            ) : null}
          </Suspense>
        </section>
      </div>
    </div>
  )
}
