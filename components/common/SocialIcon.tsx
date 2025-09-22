import { getPlatformIconByName } from "@/constants/ui"
import SmartLink from "./SmartLink"

export default function SocialIcon({
  platform,
  href,
  className = "",
}: {
  platform: string
  href: string
  className?: string
}) {
  // Ensure href is an absolute URL
  const normalizedHref =
    href.startsWith("http://") || href.startsWith("https://")
      ? href
      : `https://${href}`

  return (
    <SmartLink
      href={normalizedHref}
      className={`p-2 rounded-full transition-all duration-300 hover:scale-110 hover:rotate-3 group bg-card-bg text-card-description border border-card-border ${className}`}
      ariaLabel={`Follow us on ${platform}`}>
      <div className="group-hover:text-primary transition-colors duration-300">
        {getPlatformIconByName(platform)}
      </div>
    </SmartLink>
  )
}
