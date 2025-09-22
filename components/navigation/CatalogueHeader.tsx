import { Button } from "@/components/ui/button"
import { CatalogueHeaderProps } from "@/types/components"
import Image from "next/image"
import Link from "next/link"
import React from "react"
import { FiExternalLink, FiMail, FiPhone, FiPlus } from "react-icons/fi"
import SmartLink from "../common/SmartLink"

const CatalogueHeader: React.FC<CatalogueHeaderProps> = ({ type = "default", data, logo }) => {
  const createContactLink = (href: string, icon: React.ReactNode, label: string) => ({
    href,
    icon,
    label,
    className:
      "font-heading tracking-heading px-2 h-9 rounded-lg border hover:scale-105 transition-all duration-200 group text-xs sm:text-sm lg:text-sm flex items-center justify-center bg-card-bg text-foreground border-primary footer-cta-button",
  })

  const getContactLinks = () => {
    const links = []

    if (type === "default") {
      links.push(
        createContactLink(
          "mailto:quicktalog@outlook.com",
          <FiMail
            className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-200"
            aria-hidden="true"
          />,
          "Send email to quicktalog@outlook.com"
        )
      )
    } else if (type === "custom" && data) {
      if (data?.emailButtonNavbar && data?.email) {
        links.push(
          createContactLink(
            `mailto:${data?.email}`,
            <FiMail
              className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-200"
              aria-hidden="true"
            />,
            `Send email to ${data?.email}`
          )
        )
      }
      if (data?.phone) {
        links.push(
          createContactLink(
            `tel:${data?.phone}`,
            <FiPhone
              className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform duration-200"
              aria-hidden="true"
            />,
            `Call ${data?.phone}`
          )
        )
      }
    }

    return links
  }

  const getCTAProps = () => {
    if (type === "default") {
      return {
        href: "/auth?mode=signup",
        label: "Create Your Catalog",
        shortLabel: "Get Started",
        icon: <FiPlus className="w-4 h-4 mr-2" aria-hidden="true" />,
        ariaLabel: "Create your own digital catalog",
      }
    }

    if (type === "custom" && data?.ctaNavbar?.enabled && data?.ctaNavbar.url) {
      return {
        href: data?.ctaNavbar.url,
        label: data?.ctaNavbar.label || "Learn more",
        shortLabel: data?.ctaNavbar.label || "Learn more",
        icon: <FiExternalLink className="w-4 h-4 mr-2" aria-hidden="true" />,
        ariaLabel: data?.ctaNavbar.label || "Learn more",
      }
    }

    return null
  }

  const contactLinks = getContactLinks()
  const ctaProps = getCTAProps()
  const companyName = type === "default" ? "Quicktalog" : "Company"

  return (
    <header
      className="border-b shadow-lg z-50 bg-card-bg text-foreground border-card-border font-body tracking-body"
      role="banner"
      aria-label={`${companyName} header navigation`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2 sm:py-3">
          <div className="flex items-center">
            <Link
              href={type === "default" ? "/" : ""}
              className="flex items-center space-x-2 group transition-transform duration-200 hover:scale-105"
              aria-label={`Go to ${companyName} homepage`}>
              <Image
                src={logo ?? "/logo.svg"}
                alt={`${companyName} logo`}
                width={type === "default" ? 120 : 100}
                height={40}
                className="w-auto h-[7vh] object-cover"
              />
            </Link>
          </div>

          <nav
            className="flex items-center space-x-2 sm:space-x-4"
            role="navigation"
            aria-label="Contact and actions">
            {contactLinks.length > 0 && (
              <div
                className="hidden sm:flex items-center space-x-2"
                role="group"
                aria-label="Contact options">
                {contactLinks.map((linkProps, index) => (
                  <SmartLink
                    key={index}
                    href={linkProps.href}
                    className={linkProps.className}
                    aria-label={linkProps.label}>
                    {linkProps.icon}
                  </SmartLink>
                ))}
              </div>
            )}

            {ctaProps && (
              <Button
                asChild
                variant="secondary"
                size="default"
                className="font-heading tracking-heading text-xs sm:text-sm lg:text-sm transition-all duration-200 hover:scale-105 border hover:bg-primary/10 hover:text-primary bg-card-bg text-foreground border-primary footer-cta-button">
                <SmartLink
                  href={ctaProps.href}
                  className="flex items-center"
                  aria-label={ctaProps.ariaLabel}>
                  {ctaProps.icon}
                  <span className="hidden sm:inline">{ctaProps.label}</span>
                  <span className="sm:hidden">{ctaProps.shortLabel}</span>
                </SmartLink>
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

export default CatalogueHeader
