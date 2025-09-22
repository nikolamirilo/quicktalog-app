"use client"
import Image from "next/image"
import { useState } from "react"

export const SkeletonLoader = ({ className }: { className?: string }) => (
  <div
    className={`${className} bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 relative overflow-hidden rounded-sm`}>
    {/* Shimmer effect */}
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />

    {/* Center placeholder div */}
    <div className="flex items-center justify-center h-full">
      <div className="w-[75%] h-[75%] bg-gray-200 rounded-xl" />
    </div>
  </div>
)

export const OptimizedImage = ({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string
  alt: string
  className?: string
  priority?: boolean
}) => {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showImage, setShowImage] = useState(false)

  if (hasError) {
    return (
      <div
        className={`${className} bg-gray-50 flex items-center justify-center relative rounded-sm`}>
        <div className="text-gray-300 text-xs text-center p-2">
          <svg className="w-5 h-5 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
          No image
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      {/* Skeleton Loader - shown while loading */}
      {(isLoading || !showImage) && (
        <div className="absolute inset-0 z-10">
          <SkeletonLoader className="w-full h-full" />
        </div>
      )}

      {/* Actual Image */}
      <Image
        src={src}
        alt={alt}
        fill
        className={`${className} transition-all duration-500 ease-out ${
          showImage ? "opacity-100 scale-100" : "opacity-0 scale-102"
        }`}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        onLoad={() => {
          setIsLoading(false)
          setShowImage(true)
        }}
        onError={() => {
          setHasError(true)
          setIsLoading(false)
          setShowImage(false)
        }}
        onLoadStart={() => {
          setIsLoading(true)
          setShowImage(false)
        }}
        sizes="(max-width: 768px) 40vw, 20vw"
        quality={85}
      />
    </div>
  )
}
