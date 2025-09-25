"use client"
import { Record } from "@/types"
import { memo, useMemo } from "react"
import { OptimizedImage } from "../common/OptimizedImage"

const CardType1 = memo(
  ({ record, currency, onClick }: { record: Record; currency: string; onClick: () => void }) => {
    const slugId = useMemo(
      () => record.name?.replace(/\s+/g, "-").toLowerCase() || "",
      [record.name]
    )
    return (
      <article
        onClick={onClick}
        className="flex bg-card-bg cursor-pointer text-card-text rounded-[12px] border border-card-border shadow-lg overflow-hidden max-w-full min-h-[110px] sm:min-h-[150px]"
        role="article"
        aria-labelledby={`item-title-${slugId}`}
        tabIndex={0}>
        <div className="w-[40%] min-w-[90px] sm:min-w-[120px] aspect-[4/3] relative flex-shrink-0">
          <OptimizedImage
            src={record.image}
            alt={`Image of ${record.name}`}
            className="object-cover"
          />
        </div>

        <div className="flex flex-col p-1.5 sm:p-3 flex-1 gap-1 sm:gap-2 min-w-0">
          <h3
            id={`item-title-${slugId}`}
            className="text-[13px] sm:text-[22px] font-heading tracking-heading text-card-heading leading-tight truncate">
            {record.name}
          </h3>

          <p
            className="text-[11px] sm:text-[16px] text-card-description font-body tracking-body leading-snug line-clamp-3 sm:line-clamp-4"
            aria-describedby={`item-title-${slugId}`}>
            {record.description}
          </p>

          <div className="pt-0 sm:pt-1 mt-auto">
            <span
              className="text-[13px] sm:text-[20px] font-thin text-price font-heading tracking-heading"
              aria-label={`Price: ${record.price} ${currency}`}>
              {record.price} {currency}
            </span>
          </div>
        </div>
      </article>
    )
  }
)

export default CardType1
