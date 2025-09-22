import { generatePageMetadata } from "@/constants/metadata"
import { getPageSchema } from "@/constants/schemas"
import { Metadata } from "next"

export const metadata: Metadata = generatePageMetadata("showcases")

const page = () => {
  const showcasesPageSchema = getPageSchema("showcases")
  
  return (
    <>
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(showcasesPageSchema) }} 
      />
      <div>page</div>
    </>
  )
}

export default page
