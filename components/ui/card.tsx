//@ts-nocheck
import * as React from "react"

import { cn } from "@/helpers/client"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "form" | string
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className, type, ...props }, ref) => {
  const baseClasses =
    "text-product-foreground backdrop-blur-sm rounded-2xl shadow-product-shadow border border-product-border"
  const defaultBackground = "bg-gradient-to-br from-product-background to-hero-product-background"
  const formBackground = "bg-product-background"

  return (
    <div
      ref={ref}
      className={cn(baseClasses, type === "form" ? formBackground : defaultBackground, className)}
      {...props}
    />
  )
})

Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  )
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
  )
)
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  )
)
CardFooter.displayName = "CardFooter"

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle }
