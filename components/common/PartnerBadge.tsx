"use client"
import Image from "next/image"
import { useState } from "react"
import SmartLink from "./SmartLink"

export default function PartnerBadge({
  partner,
}: {
  partner: { name: string; logo: string; description: string; rating: number; url?: string }
}) {
  const [imageError, setImageError] = useState(false)

  return (
    <SmartLink
      href={partner.url}
      className="flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 hover:scale-102 hover:shadow-md cursor-pointer bg-card-bg text-card-description border border-card-border">
      <div className="w-8 h-8 flex items-center justify-center">
        {imageError ? (
          <span className="text-lg">{partner.name.charAt(0)}</span>
        ) : (
          <Image
            src={partner.logo || `https://logo.clearbit.com/${partner.url}`}
            alt={`${partner.name} logo`}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full"
            onError={() => setImageError(true)}
            unoptimized
          />
        )}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-sm font-heading font-weight-heading tracking-heading text-card-heading">
          {partner.name}
        </div>
        <div className="text-xs text-card-description">{partner.description}</div>
      </div>
    </SmartLink>
  )
}
