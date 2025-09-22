"use client"
import { Record } from "@/types"
import Image from "next/image"
import { memo, useMemo } from "react"

const CardType4 = memo(({ record, currency }: { record: Record; currency: string }) => {
  const slugId = useMemo(() => record.name?.replace(/\s+/g, "-").toLowerCase() || "", [record.name])
  return (
    <article
      className="flex flex-col !h-full bg-card-bg text-card-text rounded-[16px] border border-card-border shadow-[0_0_5px_1px_rgba(233,245,254,0.2)] w-full sm:w-[220px] md:w-[260px] lg:w-[320px] flex-shrink-0 overflow-hidden"
      role="article"
      aria-labelledby={`item-title-${slugId}`}
      tabIndex={0}>
      <div className="w-full aspect-[4/3] max-h-[120px] sm:max-h-[140px] md:max-h-[180px] bg-gray-100 relative">
        <Image
          src={record.image}
          alt={`Image of ${record.name}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 220px, (max-width: 1024px) 260px, 320px"
          className="object-cover"
          priority={false}
          loading="lazy"
        />
      </div>

      <div className="flex flex-col justify-start p-2 sm:p-3 gap-1 flex-grow">
        <div className="flex flex-col gap-1 flex-grow min-h-[60px]">
          <h5
            id={`item-title-${slugId}`}
            className="text-[12px] sm:text-[14px] md:text-[18px] font-heading tracking-heading text-card-heading text-left truncate">
            {record.name}
          </h5>
          <p
            className="text-[10px] sm:text-[12px] md:text-[14px] text-card-description font-body tracking-body text-left leading-snug line-clamp-3 sm:line-clamp-4"
            aria-describedby={`item-title-${slugId}`}>
            {record.description}
          </p>
        </div>

        <span
          className="text-[12px] sm:text-[14px] md:text-[18px] font-thin text-price text-left mt-auto font-heading tracking-heading flex-shrink-0"
          aria-label={`Price: ${record.price} ${currency}`}>
          {record.price} {currency}
        </span>
      </div>
    </article>
  )
})

export default CardType4
