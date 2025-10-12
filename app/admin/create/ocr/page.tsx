import { getUserData } from "@/actions/users"
import OCRBuilder from "@/components/admin/create/OCRBuilder"
import LimitsModal from "@/components/modals/LimitsModal"
import Footer from "@/components/navigation/Footer"
import Navbar from "@/components/navigation/Navbar"
import { UserData } from "@/types"

export const dynamic = "force-dynamic"
export default async function page() {
  const userData: UserData = await getUserData()
  if (userData && userData.currentPlan.id > 1) {
    return (
      <div className="product font-lora min-h-screen">
        <Navbar />
        <div className="w-full min-h-screen px-2 md:px-8 pt-24 pb-12 bg-gradient-to-br from-product-background to-hero-product-background animate-fade-in">
          <div className="container mx-auto flex flex-col px-4 gap-8">
            <OCRBuilder userData={userData} />
          </div>
        </div>
        <Footer />
      </div>
    )
  } else {
    return (
      <LimitsModal
        type="ocr"
        currentPlan={userData.currentPlan}
        requiredPlan={userData.nextPlan}
        isOpen={userData && userData.currentPlan.id > 1 ? false : true}
      />
    )
  }
}
