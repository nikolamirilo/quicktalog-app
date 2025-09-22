import { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Quicktalog - Digital Catalog Builder",
    short_name: "Quicktalog",
    description:
      "Create stunning digital catalogs in minutes with our free online catalog maker. Perfect for restaurants, salons, gyms, retail & more. No code required, mobile-friendly, QR code sharing.",
    theme_color: "#000000",
    categories: [
      "digital catalog",
      "online catalog maker",
      "business tools",
      "e-commerce",
      "restaurant menu",
      "product catalog",
      "service catalog",
      "qr code",
      "mobile catalog",
      "catalog builder",
    ],
    background_color: "#ffffff",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/logo.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/opengraph-image.png",
        sizes: "1200x630",
        type: "image/png",
      },
      {
        src: "/twitter-image.png",
        sizes: "1200x630",
        type: "image/png",
      },
    ],
  }
}
