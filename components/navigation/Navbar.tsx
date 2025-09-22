"use client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import React, { useState } from "react"

import Image from "next/image"
import { FaRegCirclePlay } from "react-icons/fa6"
import { FiHome, FiMail, FiX } from "react-icons/fi"
import { GiHamburgerMenu } from "react-icons/gi"
import AuthLinks from "./AuthLinks"

// TypeScript interfaces
interface NavLinkProps {
  href: string
  children: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}

interface MobileNavLinkProps {
  href: string
  children: React.ReactNode
  icon?: React.ComponentType<{ size?: number; className?: string }>
  onClick: () => void
}

// NavLink component for active state handling
export const NavLink = ({ href, children, icon: Icon, className = "" }: NavLinkProps) => {
  const pathname = usePathname()
  const isActive = pathname === href
  // All non-active buttons get yellow hover background and black text
  const hoverClasses = !isActive
    ? "hover:bg-yellow-200 hover:text-black hover:font-bold hover:shadow-md hover:scale-[1.03] hover:transform hover:-translate-y-[2px] hover:border-navbar-button-hover-border"
    : ""

  return (
    <Link href={href}>
      <Button
        variant="nav"
        className={`${isActive ? "font-bold !bg-product-hover-background !text-navbar-button-active !border !border-product-primary shadow-sm hover:scale-[1.03] hover:transform" : "font-medium"} ${className}`}>
        {Icon && <Icon className="w-4 h-4" />}
        {children}
      </Button>
    </Link>
  )
}
// Mobile NavLink component
export const MobileNavLink = ({ href, children, icon: Icon, onClick }: MobileNavLinkProps) => {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link href={href} onClick={onClick}>
      <button
        className={`w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-lg text-left transition-all duration-200 ${isActive
          ? "bg-product-hover-background text-product-primary border border-product-primary shadow-sm font-semibold"
          : "hover:bg-navbar-button-hover-bg hover:text-navbar-button-hover-text hover:shadow-md hover:scale-[1.03] hover:transform hover:-translate-y-[2px] border border-transparent hover:border-navbar-button-hover-border hover:font-bold"
          }`}>
        {Icon && (
          <Icon
            size={18}
            className={`${isActive ? "text-product-primary" : "text-gray-600"} sm:w-5 sm:h-5`}
          />
        )}
        <span
          className={`font-medium text-sm sm:text-base ${isActive ? "text-product-primary" : "text-product-foreground"}`}>
          {children}
        </span>
      </button>
    </Link>
  )
}

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="w-full flex items-center justify-between px-4 sm:px-6 font-lora py-2 sm:py-3 bg-product-background shadow-lg border-b border-gray-100 fixed top-0 left-0 z-50">
      <div className="flex items-center gap-2 sm:gap-3">
        <Link href="/">
          <Image
            src="/logo.svg"
            alt="Quicktalog Logo"
            width={160}
            height={160}
            className="h-[7vh] w-auto rounded-full"
            style={{ width: "auto", height: "7vh" }}
            priority //
          />
        </Link>
      </div>

      {/* Desktop links */}
      <div className="hidden lg:flex items-center gap-2">
        <NavLink href="/" icon={FiHome}>
          Home
        </NavLink>
        <NavLink href="/contact" icon={FiMail}>
          Contact
        </NavLink>
        <NavLink href="/demo" icon={FaRegCirclePlay}>
          Demo
        </NavLink>
        <AuthLinks />
      </div>

      {/* Hamburger for mobile */}
      <div className="lg:hidden flex items-center">
        <button aria-label="Open menu" onClick={() => setMobileOpen((v) => !v)} className="p-2">
          <GiHamburgerMenu size={22} className="text-product-foreground" />
        </button>
      </div>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile menu */}
      <div
        className={`mobile-menu fixed flex flex-col top-0 right-0 h-screen w-80 bg-product-background  z-50 transform transition-transform duration-300 ease-in-out ${mobileOpen ? "translate-x-0" : "translate-x-full"
          }`}
        style={{ willChange: "transform" }}>
        {/* Mobile menu header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
          <span className="font-bold text-base sm:text-lg text-black">Menu</span>
          <button
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1 transition-colors">
            <FiX size={20} className="text-product-foreground" />
          </button>
        </div>

        {/* Mobile menu items */}
        <div className="flex flex-col p-4 sm:p-6 gap-2 sm:gap-3">
          <MobileNavLink href="/" icon={FiHome} onClick={() => setMobileOpen(false)}>
            Home
          </MobileNavLink>

          <MobileNavLink href="/contact" icon={FiMail} onClick={() => setMobileOpen(false)}>
            Contact
          </MobileNavLink>

          <MobileNavLink
            href="/demo"
            icon={FaRegCirclePlay}
            onClick={() => setMobileOpen(false)}>
            Demo
          </MobileNavLink>

          <AuthLinks isMobile onLinkClick={() => setMobileOpen(false)} />
        </div>
      </div>
    </nav>
  )
}

export default Navbar
