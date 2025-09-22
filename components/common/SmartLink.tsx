import Link from "next/link"
import React from "react"

type SmartLinkProps = {
  href: string
  children: React.ReactNode
  className?: string
  ariaLabel?: string
}

const SmartLink: React.FC<SmartLinkProps> = ({ href, children, className, ariaLabel }) => {
  const isExternal = href.startsWith("http") || href.startsWith("www.")

  if (isExternal) {
    const finalHref = href.startsWith("http") ? href : `https://${href}`

    return (
      <a
        href={finalHref}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={ariaLabel}>
        {children}
      </a>
    )
  }

  return (
    <Link href={href} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  )
}

export default SmartLink
