"use client"
import { Button } from "@/components/ui/button"
import { useUser } from "@clerk/nextjs"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import React from "react"
import { FiArrowDown, FiCheck, FiClock, FiDollarSign, FiPlay, FiSmartphone } from "react-icons/fi"

// Static data for reusability
const valuePropositions = [
  { icon: FiClock, text: "Go live in under 5 minutes" },
  { icon: FiSmartphone, text: "Works on any device" },
  { icon: FiDollarSign, text: "Free online catalog maker" },
]

const trustIndicators = [
  { icon: FiCheck, text: "No credit card required" },
  { icon: FiCheck, text: "Start with our free plan" },
]

// Reusable component for icons with text
const IconText: React.FC<{ icon: React.ElementType; text: string }> = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-2">
    <Icon className="h-4 w-4 text-product-primary" />
    <span className="font-medium">{text}</span>
  </div>
)

const Hero: React.FC = () => {
  const { user } = useUser()
  const router = useRouter()
  return (
    <section
      id="hero"
      role="banner"
      className="relative flex min-h-[80vh] items-center justify-center px-4 pt-32 md:pt-40">
      {/* Background Grid */}
      <div className="absolute inset-0 -z-10 bg-hero-product-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]" />

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-b from-transparent via-[rgba(233,238,255,0.5)] to-[rgba(202,208,230,0.5)] backdrop-blur-[2px]" />

      <div className="mx-auto max-w-4xl text-center">
        <h1 className="mx-auto max-w-lg text-4xl font-bold text-product-foreground md:max-w-3xl md:text-6xl md:leading-tight">
          Create a Stunning Digital Catalog in Minutes
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-product-foreground-accent md:text-xl">
          The best free online catalog maker for businesses. Turn your services, menus, or products
          into an interactive, mobile-friendly digital catalog or price list. No code or design
          skills required.
        </p>

        {/* Value Propositions */}
        <div className="mt-6 flex flex-col items-center justify-center gap-4 text-sm text-product-foreground-accent sm:flex-row">
          {valuePropositions.map(({ icon, text }, index) => (
            <IconText key={index} icon={icon} text={text} />
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            onClick={() => {
              if (user) {
                router.push("/admin/create")
              } else {
                router.push("/auth?mode=signup")
              }
            }}
            variant="cta"
            className="h-14 px-8 py-4 text-lg max-w-56"
            aria-label="Create your digital catalog">
            Start Creating Now
          </Button>
          <Link href="/demo">
            <Button
              variant="outline"
              className="h-14 border-2 border-product-primary px-8 py-4 text-lg max-w-56"
              aria-label="Try the catalog demo">
              <FiPlay className="mr-2 h-5 w-5" />
              Try It Yourself
            </Button>
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="mt-6 flex items-center justify-center gap-6 text-sm text-product-foreground-accent">
          {trustIndicators.map(({ icon, text }, index) => (
            <IconText key={index} icon={icon} text={text} />
          ))}
        </div>

        {/* Directional Cue */}
        <div className="mt-8 flex justify-center">
          <FiArrowDown className="h-6 w-6 animate-bounce text-product-primary" />
        </div>

        {/* Hero Image */}
        <Image
          src="/images/hero-mockup.png"
          width={384 * 1.2}
          height={340 * 1.2}
          quality={100}
          sizes="(max-width: 768px) 80vw, 460px"
          priority
          alt="Interactive digital catalog"
          className="relative z-10 mx-auto mt-12 md:mt-16"
        />
      </div>
    </section>
  )
}

export default React.memo(Hero)
