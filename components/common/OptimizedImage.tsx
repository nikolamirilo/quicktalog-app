"use client"
import Image from "next/image"
import { useState } from "react"

export const SkeletonLoader = ({ className }: { className?: string }) => (
  <div
    className={`${className} bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse relative overflow-hidden`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    <div className="flex items-center justify-center h-full">
      <svg className="w-8 h-8 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  </div>
)

export const OptimizedImage = ({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) => {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  if (hasError) {
    return (
      <div className={`${className} bg-gray-200 flex items-center justify-center`}>
        <div className="text-gray-400 text-xs text-center p-2">
          <svg className="w-6 h-6 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
          Image unavailable
        </div>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 640px) 90px, 120px"
      className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-500`}
      priority={false}
      loading="lazy"
      quality={75}
      onLoad={() => setIsLoading(false)}
      onError={() => {
        setHasError(true)
        setIsLoading(false)
      }}
    />
  )
}
