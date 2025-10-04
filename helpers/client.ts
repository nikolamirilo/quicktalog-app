import { Catalogue, ContactItem, FooterData, HeaderData } from "@/types"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price) {
  if (!price.includes(".")) return price
  return price.split(".")[0]
}

const now = new Date()
export const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
export const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

export const getContactValue = (
  contact: ContactItem[] | undefined,
  type: string
): string | undefined => {
  if (!contact || !Array.isArray(contact)) return undefined
  return contact.find((c) => c.type === type)?.value
}

export function disableConsoleInProduction() {
  if (typeof window === "undefined") return

  if (process.env.NEXT_PUBLIC_DISABLE_LOGGING === "true") {
    console.clear()
    console.log = () => {}
    console.debug = () => {}
    console.info = () => {}
    console.warn = () => {}
    // Optionally preserve console.error for critical errors
    // console.error = () => {};
  }
}

export function cleanValue(value: any) {
  // Handle arrays
  if (Array.isArray(value)) {
    const cleanedArray = value
      .map(cleanValue)
      .filter(
        (v) =>
          v !== undefined &&
          !(typeof v === "object" && Object.keys(v).length === 0 && !Array.isArray(v))
      )
    return cleanedArray.length > 0 ? value : []
  }

  // Handle objects
  if (value && typeof value === "object") {
    const cleanedObj = {}
    for (const [key, val] of Object.entries(value)) {
      const cleanedVal = cleanValue(val)
      if (
        cleanedVal !== undefined &&
        !(
          typeof cleanedVal === "object" &&
          Object.keys(cleanedVal).length === 0 &&
          !Array.isArray(cleanedVal)
        )
      ) {
        cleanedObj[key] = cleanedVal
      }
    }
    return Object.keys(cleanedObj).length > 0 ? cleanedObj : {}
  }

  // Primitive values → only keep if not false/""/null/undefined
  if (value === false || value === "" || value === null || value === undefined) {
    return undefined
  }

  return value
}
export const buildHeaderData = (item: Catalogue): HeaderData => ({
  email: getContactValue(item.contact, "email") || "",
  phone: getContactValue(item.contact, "phone") || "",
  ctaNavbar: item.configuration?.ctaNavbar,
})

export const buildFooterData = (item: Catalogue): FooterData => ({
  name: item.name || "",
  partners: item.partners,
  email: getContactValue(item.contact, "email"),
  phone: getContactValue(item.contact, "phone"),
  socialLinks: {
    instagram: getContactValue(item.contact, "instagram"),
    facebook: getContactValue(item.contact, "facebook"),
    twitter: getContactValue(item.contact, "twitter"),
    website: getContactValue(item.contact, "website"),
    tiktok: getContactValue(item.contact, "tiktok"),
  },
  ctaFooter: item.configuration?.ctaFooter,
  newsletter: item.configuration?.newsletter,
  legal: item.legal,
  catalogue: {
    id: item.id,
    owner_id: item.created_by,
  },
})

export function getCurrencySymbol(code: string, locale = "en-US") {
  return (0)
    .toLocaleString(locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    .replace(/\d/g, "")
    .trim()
}

export async function fetchImageFromUnsplash(query: string): Promise<string> {
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?page=1&per_page=1&query=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Client-ID ${process.env.UNSPLASH_API_KEY}`,
        },
      }
    )

    const data = await res.json()

    if (data?.results?.[0]?.urls?.regular) {
      return data.results[0].urls.regular
    }
  } catch (err) {
    console.error(`Failed to fetch image for "${query}":`, err)
  }

  return "https://static1.squarespace.com/static/5898e29c725e25e7132d5a5a/58aa11bc9656ca13c4524c68/58aa11e99656ca13c45253e2/1487540713345/600x400-Image-Placeholder.jpg?format=original"
}

export const getGridStyle = (variant: string): string => {
  switch (variant) {
    case "variant_1":
      return "grid grid-cols-1 px-1 md:grid-cols-2 gap-3 my-1"
    case "variant_2":
      return "flex flex-wrap px-1 justify-start gap-3 mx-auto sm:gap-4 md:gap-6 my-1"
    case "variant_3":
      return "grid grid-cols-1 px-1 md:grid-cols-2 gap-3 my-1"
    case "variant_4":
      return ""
    default:
      return "flex flex-row flex-wrap gap-3 my-1"
  }
}

export const contentVariants = {
  hidden: { height: 0, opacity: 0, marginTop: 0 },
  visible: { height: "auto", opacity: 1, marginTop: 16 },
}

export const handleDownloadHTML = (restaurantName: string, fullURL: string) => {
  try {
    const html = `<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n  <title>Embedded Catalogue</title>\n  <style>\n    html, body { margin: 0; padding: 0; height: 100%; width: 100%; background: white; }\n    iframe { width: 100vw; height: 100vh; border: none; position: fixed; top: 0; left: 0; z-index: 9999; background: white; }\n  </style>\n</head>\n<body>\n  <iframe src=\"${fullURL}\"></iframe>\n</body>\n</html>`

    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")

    a.href = url
    a.download = `${restaurantName}.html`
    document.body.appendChild(a)
    a.click()

    setTimeout(() => {
      try {
        if (a.parentNode === document.body) {
          document.body.removeChild(a)
        }
      } catch (removeError) {
        console.warn("Element already removed or not found:", removeError)
      }
      URL.revokeObjectURL(url)
    }, 100)
  } catch (error) {
    console.error("Error in handleDownloadHTML:", error)
  }
}

export const handleDownloadPng = (restaurantName: string) => {
  const svg = document.querySelector("#qr-code svg")
  if (!svg) {
    console.error("QR SVG not found!")
    return
  }
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute("width", "512")
  clone.setAttribute("height", "512")
  const serializer = new XMLSerializer()
  const source = serializer.serializeToString(clone)
  const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const img = new window.Image()
  img.onload = function () {
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext("2d")
    ctx!.fillStyle = "#fff"
    ctx!.fillRect(0, 0, canvas.width, canvas.height)
    ctx!.drawImage(img, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error("Failed to create PNG blob from canvas!")
        return
      }
      const url2 = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.download = `${restaurantName}.png`
      a.href = url2
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url2)
      URL.revokeObjectURL(url)
    }, "image/png")
  }
  img.onerror = function () {
    console.error("Failed to load SVG as image!")
    URL.revokeObjectURL(url)
  }
  img.src = url
}

export const generateUniqueSlug = (name: string) => {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // replace multiple spaces with single dash
    .replace(/-+/g, "-") // collapse multiple dashes
    .replace(/^-|-$/g, "") // remove leading/trailing dash

  return slug
}

export function toTitleCase(str) {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
}
