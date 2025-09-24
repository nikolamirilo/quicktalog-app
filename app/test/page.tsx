"use client"

import ItemInfoModal from "@/components/modals/ItemInfoModal"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const page = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-product-background p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-product-foreground mb-8 text-center">
          Test Page - Item Info Modal
        </h1>
        
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="w-full bg-product-primary text-product-foreground hover:bg-product-primary-accent transition-colors duration-200"
        >
          Open Item Info Modal
        </Button>

        <ItemInfoModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </div>
  )
}

export default page
