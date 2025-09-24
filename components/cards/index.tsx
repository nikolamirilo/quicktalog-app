"use client"
import { Record } from "@/types"
import { useState } from "react"
import ItemDetailModal from "../modals/ItemDetailModal"
import CardType1 from "./CardType1"
import CardType2 from "./CardType2"
import CardType3 from "./CardType3"
import CardType4 from "./CardType4"

const CardsSwitcher = ({
  variant,
  record,
  currency,
  i,
}: {
  variant: string
  record: Record
  currency: string
  i: number
}) => {
  // Validate record data
  if (!record || !record.name || record.price === undefined) {
    console.error("CardsSwitcher: Invalid record data:", record)
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
        role="alert"
        aria-live="polite">
        <p>Invalid item data</p>
      </div>
    )
  }

  const [isModalOpen, setIsModalOpen] = useState(false)
  const price = typeof record.price === "number" ? record.price : parseFloat(record.price) || 0

  const validatedRecord = {
    ...record,
    price,
    image: record.image || "/placeholder-image.jpg",
  }

  // Helper function to pick card component
  const renderCard = () => {
    switch (variant) {
      case "variant_1":
        return (
          <CardType1
            key={i}
            record={validatedRecord}
            currency={currency}
            onClick={() => {
              setIsModalOpen(true)
            }}
          />
        )
      case "variant_2":
        return (
          <CardType2
            key={i}
            record={validatedRecord}
            currency={currency}
            onClick={() => {
              setIsModalOpen(true)
            }}
          />
        )
      case "variant_3":
        return (
          <CardType3
            key={i}
            record={validatedRecord}
            currency={currency}
            onClick={() => {
              setIsModalOpen(true)
            }}
          />
        )
      case "variant_4":
        return (
          <CardType4
            key={i}
            record={validatedRecord}
            currency={currency}
            onClick={() => {
              setIsModalOpen(true)
            }}
          />
        )
      default:
        return (
          <CardType1
            key={i}
            record={validatedRecord}
            currency={currency}
            onClick={() => {
              setIsModalOpen(true)
            }}
          />
        )
    }
  }

  return (
    <>
      {renderCard()}
      <ItemDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={validatedRecord}
        currency={currency}
      />
    </>
  )
}

export default CardsSwitcher
