"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import Image from "next/image"

interface ItemInfoModalProps {
  isOpen: boolean
  onClose: () => void
  item?: {
    name: string
    description: string
    price: number
    image?: string
  }
}

export default function ItemInfoModal({ 
  isOpen, 
  onClose, 
  item = {
    name: "Chocolate Cake",
    description: "Decadent layers of rich chocolate cake filled with creamy chocolate ganache, topped with chocolate frosting and chocolate shavings.",
    price: 4.99,
    image: "https://sugargeekshow.com/wp-content/uploads/2023/10/easy_chocolate_cake_slice-500x500.jpg"
  }
}: ItemInfoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="text-product-foreground max-w-sm w-[90vw] sm:max-w-md sm:w-full p-0 bg-product-background border border-product-border shadow-product-shadow rounded-2xl overflow-hidden fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-h-[90vh] flex flex-col">
        {/* Image Section */}
        {item.image && (
          <div className="relative w-full h-40 sm:h-48 bg-product-foreground-accent/10 flex-shrink-0">
            <Image
              src={item.image}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 90vw, 400px"
              priority
            />
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        )}
        
        {/* Content Section */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6">
            <DialogHeader className="space-y-4 text-left mb-6">
              <DialogTitle className="text-xl sm:text-2xl font-bold text-product-foreground font-heading leading-tight">
                {item.name}
              </DialogTitle>
              <DialogDescription className="text-product-foreground-accent text-sm sm:text-base leading-relaxed">
                {item.description}
              </DialogDescription>
            </DialogHeader>

            {/* Price Section */}
            <div className="mt-6 pt-4 border-t border-product-border">
              <div className="flex items-center justify-center sm:justify-between flex-col sm:flex-row gap-2 sm:gap-0">
                <span className="text-xs sm:text-sm text-product-foreground-accent uppercase tracking-wide font-medium">Price</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs sm:text-sm text-product-foreground-accent">€</span>
                  <span className="text-2xl sm:text-3xl font-bold text-product-primary tabular-nums">
                    {item.price.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
