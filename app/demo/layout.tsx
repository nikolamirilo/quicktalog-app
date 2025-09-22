import { generatePageMetadata } from "@/constants/metadata"
import type { Metadata } from "next"

export const metadata: Metadata = generatePageMetadata("demo")

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children
}


