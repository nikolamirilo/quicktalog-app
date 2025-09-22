"use client"
import { Record } from "@/types"
import { memo, useMemo } from "react"
import { OptimizedImage } from "../common/OptimizedImage"

const CardType2 = memo(({ record, currency }: { record: Record; currency: string }) => {
  const slugId = useMemo(() => record.name?.replace(/\s+/g, "-").toLowerCase() || "", [record.name])
  return (
    <article
      className="flex flex-col bg-card-bg text-card-text rounded-[12px] border border-card-border shadow-[0_0_5px_1px_rgba(233,245,254,0.2)] overflow-hidden w-[45%] max-w-[180px] sm:max-w-[220px] md:max-w-[260px]"
      role="article"
      aria-labelledby={`item-title-${slugId}`}
      tabIndex={0}>
      <div className="aspect-[4/3] bg-gray-100 relative w-full">
        <OptimizedImage
          src={record.image}
          alt={`Image of ${record.name}`}
          className="object-cover"
        />
      </div>

      <div className="flex flex-col justify-between flex-1 p-2 sm:p-3 md:p-4 gap-1.5 sm:gap-2">
        <div className="flex-1 min-h-0">
          <h3
            id={`item-title-${slugId}`}
            className="text-[14px] sm:text-[18px] md:text-[22px] font-heading tracking-heading text-card-heading leading-tight truncate">
            {record.name}
          </h3>
          <p
            className="text-[12px] sm:text-[15px] md:text-[16px] text-card-description font-body tracking-body leading-snug line-clamp-2 sm:line-clamp-3"
            aria-describedby={`item-title-${slugId}`}>
            {record.description}
          </p>
        </div>

        <div className="flex-shrink-0">
          <span
            className="text-[14px] sm:text-[18px] md:text-[22px] text-price font-heading tracking-heading"
            aria-label={`Price: ${record.price} ${currency}`}>
            {record.price} {currency}
          </span>
        </div>
      </div>
    </article>
  )
})

export default CardType2
