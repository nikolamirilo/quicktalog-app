import ClarityScript from "@/components/analytics/ClarityScript"
import { PageWrapperClient } from "@/components/wrappers/PageWrapperClient"
import { generatePageMetadata } from "@/constants/metadata"
import {
  crimsonText,
  inter,
  loraRegular,
  loraSemiBold,
  nunito,
  playfairDisplay,
  poppins,
} from "@/fonts"
import { GoogleTagManager } from "@next/third-parties/google"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = generatePageMetadata("home")

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${loraRegular.variable} ${loraSemiBold.variable} ${playfairDisplay.variable} ${inter.variable} ${nunito.variable} ${crimsonText.variable} ${poppins.variable} antialiased`}>
      <head>
        <ClarityScript />
        <GoogleTagManager gtmId={process.env.GTM_ID} />
      </head>

      <body className="product">
        <PageWrapperClient children={children} />
      </body>
    </html>
  )
}
