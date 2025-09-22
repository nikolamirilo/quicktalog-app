import Auth from "@/components/auth/Auth"
import Footer from "@/components/navigation/Footer"
import Navbar from "@/components/navigation/Navbar"
import { generatePageMetadata } from "@/constants/metadata"
import { Metadata } from "next"

export const metadata: Metadata = generatePageMetadata("authentication")

const page = () => {
  return (
    <>
      <Navbar />
      <Auth />
      <Footer />
    </>
  )
}
export default page
