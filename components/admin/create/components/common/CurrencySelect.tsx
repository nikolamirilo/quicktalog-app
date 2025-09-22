"use client"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { currencies } from "@/constants"
import { useEffect, useState } from "react"

export function CurrencySelect({
  value,
  onChange,
}: {
  value: string
  onChange: (val: string) => void
}) {
  const [defaultCurrency, setDefaultCurrency] = useState<string>("")

  useEffect(() => {
    try {
      const userLocale = navigator.language

      const matchedCurrency = currencies.find((c) => c.locale === userLocale)?.value
      const fallbackCurrency = new Intl.NumberFormat(userLocale, {
        style: "currency",
        currency: "USD",
      }).resolvedOptions().currency

      const detectedCurrency = matchedCurrency || fallbackCurrency || "USD"

      const isValidCurrency = currencies.some((c) => c.value === detectedCurrency)

      if (isValidCurrency) {
        setDefaultCurrency(detectedCurrency)
        if (!value) onChange(detectedCurrency)
      }
    } catch (err) {
      console.error("Could not detect currency", err)
    }
  }, [value, onChange])

  return (
    <Select value={value || defaultCurrency} onValueChange={onChange}>
      <SelectTrigger className="border-product-border focus:border-product-primary focus:ring-product-primary/20">
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => (
          <SelectItem key={currency.value} value={currency.value} className="cursor-pointer">
            {currency.label} ({currency.symbol})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
