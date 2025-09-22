import { Crimson_Text, Inter, Lora, Nunito, Playfair_Display, Poppins } from "next/font/google"

export const loraRegular = Lora({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-lora-regular",
  display: "swap",
})

export const loraSemiBold = Lora({
  weight: "700",
  subsets: ["latin"],
  variable: "--font-lora-semibold",
  display: "swap",
})

// Theme Fonts
export const playfairDisplay = Playfair_Display({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-playfair-display",
  display: "swap",
})

export const inter = Inter({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const nunito = Nunito({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
})

export const crimsonText = Crimson_Text({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-crimson-text",
  display: "swap",
})

export const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
})
