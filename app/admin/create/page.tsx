import { getUserData } from "@/actions/users"
import Builder from "@/components/admin/create/Builder"
import Navbar from "@/components/navigation/Navbar"

export const dynamic = "force-dynamic"

export default async function page() {
  const userData = await getUserData()
  return (
    <div className="product font-lora min-h-screen">
      <Navbar />
      <div className="w-full min-h-screen md:px-8 pt-32 pb-12 bg-gradient-to-br from-product-background to-hero-product-background animate-fade-in">
        <div className="container mx-auto flex flex-col px-4 gap-8">
          <Builder type="create" userData={userData} />
        </div>
      </div>
    </div>
  )
}
