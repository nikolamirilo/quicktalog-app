import { Record } from "@/types"
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

  // Ensure price is a number
  const price = typeof record.price === "number" ? record.price : parseFloat(record.price) || 0

  // Create a validated record
  const validatedRecord = {
    ...record,
    price,
    image: record.image || "/placeholder-image.jpg",
  }

  switch (variant) {
    case "variant_1":
      return <CardType1 key={i} record={validatedRecord} currency={currency} />
    case "variant_2":
      return <CardType2 key={i} record={validatedRecord} currency={currency} />
    case "variant_3":
      return <CardType3 key={i} record={validatedRecord} currency={currency} />
    case "variant_4":
      return <CardType4 key={i} record={validatedRecord} currency={currency} />
    default:
      return <CardType1 key={i} record={validatedRecord} currency={currency} />
  }
}

export default CardsSwitcher
