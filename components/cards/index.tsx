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
  theme,
}: {
  variant: string
  record: Record
  currency: string
  i: number
  theme?: string
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
  const price = record.price === 0 ? "Free" : record.price ? record.price.toLocaleString() : "Free"
  const formatedCurrency = price != "Free" ? currency : ""

  const validatedRecord = {
    ...record,
    price,
    image:
      record.image ||
      "https://vgrutvaw2q.ufs.sh/f/X7AUkOrs4vhbLZJd0wWMZP0cAtUu7EI5sD2VGw41vjTYyfKL",
  }

  // Helper function to pick card component
  const renderCard = () => {
    switch (variant) {
      case "variant_1":
        return (
          <CardType1
            key={i}
            record={validatedRecord}
            currency={formatedCurrency}
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
            currency={formatedCurrency}
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
            currency={formatedCurrency}
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
            currency={formatedCurrency}
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
            currency={formatedCurrency}
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
        currency={formatedCurrency}
        theme={theme}
        variant={variant}
      />
    </>
  )
}

export default CardsSwitcher
