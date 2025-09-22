import { getUserData } from "@/actions/users"
import Dashboard from "@/components/admin/dashboard/Dashboard"
import FloatingActionMenu from "@/components/admin/dashboard/FloatingActionMenu"
import Footer from "@/components/navigation/Footer"
import Navbar from "@/components/navigation/Navbar"
import { Button } from "@/components/ui/button"
import type { AreLimitesReached, UserData } from "@/types"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function page() {
  const userData: UserData = await getUserData()

  if (!userData) {
    return (
      <div className="product font-lora min-h-screen">
        <Navbar />
        <div className="text-center text-black text-2xl h-screen flex flex-col gap-5 items-center justify-center">
          <p>Something went wrong. Please try again later.</p>
          <Button size="lg">
            <Link href="/">Go to Home</Link>
          </Button>
        </div>
      </div>
    )
  }

  const { pricing_plan, usage, ...user } = userData
  const areLimitesReached: AreLimitesReached = {
    catalogues: usage.catalogues >= pricing_plan.features.catalogues,
    ocr: usage.ocr >= pricing_plan.features.ocr_ai_import || usage.catalogues >= pricing_plan.features.catalogues,
    prompts: usage.prompts >= pricing_plan.features.ai_catalogue_generation || usage.catalogues >= pricing_plan.features.catalogues,
  }

  return (
    <div className="product font-lora min-h-screen">
      <Navbar />
      <Dashboard user={user} pricingPlan={pricing_plan} usage={usage} />
      <FloatingActionMenu planId={pricing_plan.id} areLimitsReached={areLimitesReached} />
      <Footer />
    </div>
  )
}
