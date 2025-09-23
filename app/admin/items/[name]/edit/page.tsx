import ServicesFormSwitcher from "@/components/admin/create/ServicesFormSwitcher"
import Navbar from "@/components/navigation/Navbar"
import { ContactInfo, ServicesFormData } from "@/types"
import { createClient } from "@/utils/supabase/server"

export default async function EditServicesPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params

  const supabase = await createClient()
  const { data, error } = await supabase.from("catalogues").select("*").eq("name", name).single()

  if (error || !data) {
    return <div className="p-8 text-center text-red-600">Failed to load catalog data. Please refresh the page and try again.</div>
  }

  // Transform DB data to ServicesFormData shape
  const services = data.services || []

  let contact: ContactInfo[] = []
  if (Array.isArray(data.contact)) {
    contact = data.contact
  } else if (data.contact && typeof data.contact === "object") {
    contact = Object.entries(data.contact).map(([type, value]) => ({
      type,
      value: String(value),
    }))
  }
  const initialData: ServicesFormData = {
    name: data.name || "",
    status: data.status || "draft",
    theme: data.theme || "",
    logo: data.logo || "",
    title: data.title || "",
    currency: data.currency || "",
    legal: data.legal || undefined,
    partners: data.partners || undefined,
    configuration: data.configuration || undefined,
    contact,
    subtitle: data.subtitle || "",
    services,
  }

  return (
    <div className="product font-lora min-h-screen">
      <Navbar />
      <div className="w-full min-h-screen px-4 sm:px-4 relative md:px-6 lg:px-8 pt-32 pb-12 bg-gradient-to-br from-product-background to-hero-product-background animate-fade-in">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 md:gap-6 lg:gap-8">
          <ServicesFormSwitcher type="edit" initialData={initialData} />
        </div>
      </div>
    </div>
  )
}
