import ServicesFormSwitcher from "@/components/admin/create/ServicesFormSwitcher"
import Navbar from "@/components/navigation/Navbar"

export const dynamic = "force-dynamic"

export default async function page() {
  return (
    <div className="product font-lora min-h-screen">
      <Navbar />
      <div className="w-full min-h-screen md:px-8 pt-32 pb-12 bg-gradient-to-br from-product-background to-hero-product-background animate-fade-in">
        <div className="container mx-auto flex flex-col px-4 gap-8">
          <ServicesFormSwitcher type="create" />
        </div>
      </div>
    </div>
  )
}
