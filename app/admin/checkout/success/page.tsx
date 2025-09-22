import { Button } from "@/components/ui/button"
import Link from "next/link"

const page = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-product-background to-hero-product-background">
      <div className="w-full max-w-2xl py-8 sm:py-12 px-4 sm:px-6 mx-4 text-center transition-all transform bg-product-background border border-product-border shadow-md rounded-3xl hover:shadow-product-hover-shadow">
        <div className="flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 sm:mb-8 bg-green-100 rounded-full border border-green-200">
                      <svg
              className="w-8 h-8 sm:w-12 sm:h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round" 
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"></path>
            </svg>
        </div>

        <h1 className="mb-4 sm:mb-6 text-2xl sm:text-3xl md:text-4xl font-bold text-product-foreground font-heading">Payment Successful!</h1>

        <p className="mb-6 sm:mb-8 text-base sm:text-lg md:text-xl text-product-foreground-accent font-body">Thank you for your purchase.</p>

        <div className="pt-6 sm:pt-8 mt-6 sm:mt-8 border-t border-product-border">
          <p className="text-base sm:text-lg text-product-foreground-accent font-body">Have questions? Contact us at:</p>
          <a
            href="mailto:quicktalog@outlook.com"
            className="inline-block mt-2 text-lg sm:text-xl font-medium text-product-primary hover:text-product-primary-accent transition-colors duration-200">
            quicktalog@outlook.com
          </a>
        </div>

        <Button className="mt-8 sm:mt-12" size="lg" variant="cta">
          <Link href="/admin/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}

export default page
