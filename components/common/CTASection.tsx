import { Star } from "lucide-react"
import Link from "next/link"
import { Button } from "../ui/button"

const CTASection = ({
  title,
  subtitle,
  href,
  ctaLabel,
}: {
  title: string
  subtitle: string
  href: string
  ctaLabel: string
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-center mb-6 justify-between gap-4 bg-gradient-to-r from-product-primary/10 to-product-primary/5 border-2 border-product-primary rounded-2xl p-6 shadow-lg">
      <div className="text-center sm:text-left">
        <h2 className="text-xl font-bold text-product-foreground flex items-center gap-2">
          <Star className="w-5 h-5 text-product-primary" />
          {title}
        </h2>
        <p className="text-product-foreground-accent text-sm mt-1">{subtitle}</p>
      </div>
      <Link href={href}>
        <Button
          variant="default"
          className="w-fit min-w-56 bg-product-primary hover:bg-product-primary-accent shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <Star className="w-4 h-4" />
          {ctaLabel}
        </Button>
      </Link>
    </div>
  )
}

export default CTASection
