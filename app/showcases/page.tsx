import Section from "@/components/home/Section"
import Showcases from "@/components/home/Showcases/Showcases"
import Footer from "@/components/navigation/Footer"
import { SectionSkeleton } from "@/components/navigation/Loader"
import Navbar from "@/components/navigation/Navbar"
import { generatePageMetadata } from "@/constants/metadata"
import { Metadata } from "next"
import { Suspense } from "react"

export const metadata: Metadata = generatePageMetadata("showcases")

const page = () => {
  const data = [
    "https://www.quicktalog.app/catalogues/entre-fuego-y-tierra",
    "https://www.quicktalog.app/catalogues/topclass-collections",
    "https://www.quicktalog.app/catalogues/m-motors-taller-y-venta-de-sensores",
    "https://www.quicktalog.app/catalogues/montre-shop",
    "https://www.quicktalog.app/catalogues/take-a-vape-catalogo",
    "https://www.quicktalog.app/catalogues/electronic-sale",
    "https://www.quicktalog.app/catalogues/watches-established-stock-catalog",
    "https://www.quicktalog.app/catalogues/gonvitech",
  ]
  const result = data.map((url) => {
    const slug = url.split("/").pop()
    const title = slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
    return { title, src: url }
  })
  return (
    <>
      <div className="py-16 md:py-20 2xl:py-24 flex w-full flex-col justify-center items-center">
        <Navbar />
        <Section
          id="showcases"
          title="Explore Real Catalog Examples"
          description="Discover how businesses across industries are using Quicktalog to create stunning digital catalogs. From fashion boutiques to electronics stores, see the possibilities for your own catalog.">
          <Suspense fallback={<SectionSkeleton height="h-96" />}>
            <Showcases data={result} />
          </Suspense>
        </Section>
      </div>
      <Footer />
    </>
  )
}

export default page
