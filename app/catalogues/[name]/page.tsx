//@ts-nocheck
import LimitsModal from "@/components/modals/LimitsModal"
import CatalogueFooter from "@/components/navigation/CatalogueFooter"
import CatalogueHeader from "@/components/navigation/CatalogueHeader"
import ServicesSection from "@/components/sections/ServicesSection"
import { DARK_THEMES } from "@/constants"
import { generateCatalogueMetadata } from "@/constants/metadata"
import { buildFooterData, buildHeaderData } from "@/helpers/client"
import { ServiceCatalogue } from "@/types"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export const revalidate = 86400

export async function generateStaticParams() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/items?type=name`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: {
        tags: ["catalogues-list"],
        revalidate: 3600,
      },
    })

    if (!res.ok) {
      console.warn("Error fetching catalogues:", res.statusText)
      return []
    }

    const data = await res.json()

    return (
      data?.map((catalogue: { name: string }) => ({
        name: catalogue.name,
      })) || []
    )
  } catch (error) {
    console.warn("generateStaticParams error:", error)
    return []
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ name: string }>
}): Promise<Metadata> {
  try {
    const { name } = await params

    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/items/${name}?type=meta`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: {
        tags: [`catalogue-${name}`, "catalogue-metadata"],
        revalidate: 3600,
      },
    })

    if (!res.ok) {
      return {
        title: "Catalogue Not Found | Quicktalog",
        description: "The service catalogue you're looking for doesn't exist or has been removed.",
      }
    }

    const data = await res.json()

    if (!data) {
      return {
        title: "Catalogue Not Found | Quicktalog",
        description: "The service catalogue you're looking for doesn't exist or has been removed.",
      }
    }

    return generateCatalogueMetadata(data.title, data.subtitle, name)
  } catch (error) {
    console.warn("generateMetadata error:", error)
    return {
      title: "Catalogue | Quicktalog",
      description: "Explore this digital service catalogue created with Quicktalog.",
    }
  }
}

const page = async ({ params }: { params: Promise<{ name: string }> }) => {
  try {
    const { name } = await params

    if (!name) {
      throw new Error("Service catalogue name is required")
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/items/${name}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: {
        tags: [`catalogue-${name}`, "catalogue-detail"],
      },
    })

    if (!res.ok) {
      if (res.status === 404) {
        notFound()
      }
    }

    const data = await res.json()

    if (!data) {
      console.warn("No data found for the service catalogue")
    }

    const item = data as ServiceCatalogue

    if (!item.title || !item.services) {
      console.warn("Invalid service catalogue data:", item)
    }

    const isEmpty = (value: any): boolean => {
      if (value === null || value === undefined) return true
      if (Array.isArray(value)) return value.length === 0
      if (typeof value === "object") return Object.keys(value).length === 0
      if (typeof value === "string") return value.trim().length === 0
      return false
    }

    const isFreePlan =
      isEmpty(item.partners) &&
      isEmpty(item.configuration) &&
      isEmpty(item.legal) &&
      isEmpty(item.logo) &&
      isEmpty(item.contact)

    if (item.status === "active") {
      const headerData = isFreePlan ? undefined : buildHeaderData(item)
      const footerData = isFreePlan ? undefined : buildFooterData(item)

      // const catalogueSchema = generateCatalogueSchema(item)

      return (
        <div
          className={`${item.theme || "theme-elegant"} bg-background text-foreground min-h-screen flex flex-col`}
          role="application"
          aria-label={`${item.title} Catalogue`}>
          {/* <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(catalogueSchema) }}
          /> */}

          {isFreePlan ? (
            <CatalogueHeader
              type="default"
              logo={
                DARK_THEMES.some((theme) => theme === item.theme) ? "/logo-light.svg" : "/logo.svg"
              }
            />
          ) : (
            <CatalogueHeader
              type="custom"
              data={headerData}
              logo={
                item.logo
                  ? item.logo
                  : DARK_THEMES.some((theme) => theme === item.theme)
                    ? "/logo-light.svg"
                    : "/logo.svg"
              }
            />
          )}

          <main
            className="flex-1 flex flex-col min-h-0"
            role="main"
            aria-label="Service catalogue content">
            <section
              className="flex flex-col justify-start items-center text-center px-4 pt-8 sm:pt-12 md:pt-16 flex-shrink-0"
              aria-labelledby="catalogue-title">
              <div className="max-w-4xl mx-auto">
                <h1
                  id="catalogue-title"
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-lora font-semibold text-heading drop-shadow-sm mb-4">
                  {item.title}
                </h1>
                {item.subtitle && (
                  <p
                    className="text-text text-base sm:text-lg md:text-xl lg:text-2xl px-5 max-w-[900px] font-lora font-normal leading-relaxed"
                    aria-describedby="catalogue-title">
                    {item.subtitle}
                  </p>
                )}
              </div>
            </section>

            {/* Services Section */}
            <section
              className="flex-1 w-full max-w-7xl mx-auto lg:px-8 pt-8 sm:pt-12 md:pt-16 pb-8 min-h-[60vh]"
              aria-label="Services and items">
              <ServicesSection servicesData={item.services} currency={item.currency} type="item" theme={item.theme} />
            </section>
          </main>

          {/* Conditional Footer rendering */}
          {isFreePlan ? (
            <CatalogueFooter
              type="default"
              logo={
                DARK_THEMES.some((theme) => theme === item.theme) ? "/logo-light.svg" : "/logo.svg"
              }
            />
          ) : (
            <CatalogueFooter
              type="custom"
              data={footerData}
              logo={
                item.logo
                  ? item.logo
                  : DARK_THEMES.some((theme) => theme === item.theme)
                    ? "/logo-light.svg"
                    : "/logo.svg"
              }
            />
          )}
        </div>
      )
    } else {
      return <LimitsModal type="traffic" />
    }
  } catch (error) {
    console.warn("Service catalogue page error:", error)
    return <LimitsModal type="traffic" />
  }
}

export default page
