"use client"
import { memo } from "react"

export const CardType1Skeleton = memo(() => {
  return (
    <article
      className="flex bg-card-bg text-card-text rounded-[12px] border border-card-border shadow-lg overflow-hidden max-w-full min-h-[110px] sm:min-h-[150px]"
      role="status"
      aria-busy="true">
      {/* Image Skeleton */}
      <div className="w-[40%] min-w-[90px] sm:min-w-[120px] aspect-[4/3] relative flex-shrink-0">
        <div className="h-full w-full animate-pulse bg-gray-300 dark:bg-gray-700" />
      </div>

      {/* Text Skeleton */}
      <div className="flex flex-col p-1.5 sm:p-3 flex-1 gap-1 sm:gap-2 min-w-0">
        {/* Title */}
        <div className="h-[14px] sm:h-[22px] w-2/3 rounded-md animate-pulse bg-gray-300 dark:bg-gray-700" />

        {/* Description (multiple lines) */}
        <div className="flex flex-col gap-1 sm:gap-2 mt-1">
          <div className="h-[11px] sm:h-[16px] w-full rounded-md animate-pulse bg-gray-300 dark:bg-gray-700" />
          <div className="h-[11px] sm:h-[16px] w-5/6 rounded-md animate-pulse bg-gray-300 dark:bg-gray-700" />
          <div className="h-[11px] sm:h-[16px] w-4/6 rounded-md animate-pulse bg-gray-300 dark:bg-gray-700" />
        </div>

        {/* Price */}
        <div className="pt-0 sm:pt-1 mt-auto">
          <div className="h-[13px] sm:h-[20px] w-1/4 rounded-md animate-pulse bg-gray-300 dark:bg-gray-700" />
        </div>
      </div>
    </article>
  )
})
