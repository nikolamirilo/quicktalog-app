"use client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SuccessModalProps } from "@/types/components"
import { QRCodeSVG } from "qrcode.react"
import * as React from "react"
import { useEffect, useRef, useState } from "react"
import { FaCode } from "react-icons/fa6"
import { FiCheckCircle, FiHome } from "react-icons/fi"
import { ImEmbed2 } from "react-icons/im"
import { IoMdCheckmark, IoMdOpen } from "react-icons/io"
import { IoQrCode, IoShareSocialOutline } from "react-icons/io5"
import { MdContentCopy } from "react-icons/md"

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen = false,
  onClose,
  catalogueUrl,
  type = "regular",
}) => {
  const [fullURL, setFullURL] = useState("")
  const [copied, setCopied] = useState(false)

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(iframeCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000) // reset after 3s
  }
  const codeRef = useRef<HTMLDivElement>(null)
  const iframeCode = `<iframe src="${fullURL}" style="width:100vw;height:100vh;border:none;position:fixed;top:0;left:0;z-index:9999;background:white;"></iframe>`

  const handleDownloadPng = () => {
    const svg = document.querySelector("#success-modal-qr svg")
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
        const restaurantName = catalogueUrl.split("/")[2]
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



  const handleDownloadHTML = () => {
    try {
      const html = `<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />\n  <title>Embedded Catalogue</title>\n  <style>\n    html, body { margin: 0; padding: 0; height: 100%; width: 100%; background: white; }\n    iframe { width: 100vw; height: 100vh; border: none; position: fixed; top: 0; left: 0; z-index: 9999; background: white; }\n  </style>\n</head>\n<body>\n  <iframe src=\"${fullURL}\"></iframe>\n</body>\n</html>`

      const blob = new Blob([html], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      const restaurantName = catalogueUrl.split("/")[2] || "catalogue"

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

  useEffect(() => {
    setFullURL(`${window.location.origin}${catalogueUrl}`)
  }, [catalogueUrl])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose()
    }}>
      <DialogContent className="max-h-[90vh] sm:max-h-[85vh] overflow-y-auto w-[95vw] max-w-[95vw] sm:max-w-[550px] !p-4 sm:!p-7 bg-white/95 border border-product-border shadow-product-shadow rounded-3xl">
        <DialogHeader className="space-y-2 sm:space-y-3">
          <div className="flex items-center justify-center gap-3">
            <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold text-product-foreground font-heading">
              {type === "edit" ? (
                <div className="flex items-center gap-2">
                  <FiCheckCircle className="w-6 h-6 text-green-500" />
                  Changes Saved!
                </div>
              ) : (
                "🎉 Congratulations!"
              )}
            </DialogTitle>
          </div>
          <DialogDescription className="text-center text-product-foreground-accent text-xs sm:text-sm md:text-base font-body">
            {type === "edit"
              ? "Your catalogue has been successfully updated. All changes are now live and visible to your customers."
              : type === "ai"
                ? "Your AI-generated Catalogue is now live and ready to share with your customers."
                : "Your Catalogue is now live and ready to share with your customers."}
          </DialogDescription>
        </DialogHeader>

        {/* Two-column layout for better space usage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
          {/* QR Code Section */}
          <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4 p-3 sm:p-4 md:p-5 bg-product-background/50 rounded-xl border border-product-border">
            <div className="flex items-center gap-2">
              <IoShareSocialOutline className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-product-primary" />
              <h4 className="text-xs sm:text-sm md:text-base font-semibold text-product-foreground font-body">
                Share instantly
              </h4>
            </div>
            <p className="text-xs text-product-foreground-accent text-center font-body">
              Use the QR code below for quick access
            </p>
            <div
              id="success-modal-qr"
              className="p-2 sm:p-3 bg-white rounded-xl shadow-sm border border-product-border">
              <QRCodeSVG
                value={fullURL}
                size={100}
                className="w-24 h-24 sm:w-30 sm:h-30 md:w-36 md:h-36"
                bgColor="white"
                fgColor="black"
              />
            </div>
            <Button
              onClick={handleDownloadPng}
              variant="outline"
              size="sm"
              className="bg-product-background text-xs">
              <IoQrCode className="w-3 h-3 sm:w-4 sm:h-4" /> Download QR code
            </Button>
          </div>

          {/* Embed Section */}
          <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4 p-3 sm:p-4 md:p-5 bg-product-background/50 rounded-xl border border-product-border">
            <div className="flex items-center gap-2">
              <ImEmbed2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-product-primary" />
              <h4 className="text-xs sm:text-sm md:text-base font-semibold text-product-foreground font-body">
                Embed Anywhere
              </h4>
            </div>
            <p className="text-xs text-product-foreground-accent text-center font-body">
              Copy the code to add to your website
            </p>
            <div
              ref={codeRef}
              className="bg-gray-900 rounded-xl p-2 sm:p-3 md:p-4 text-xs overflow-x-auto font-mono border border-gray-700 transition-all duration-200 text-gray-300 leading-relaxed max-h-28 sm:max-h-32 md:max-h-44">
              <pre className="whitespace-pre-wrap break-all relative m-0">
                {iframeCode}
                <button
                  onClick={handleCopyCode}
                  className={`absolute -top-2 -right-2 p-1 rounded-lg transition-colors duration-300 ${copied
                    ? "bg-green-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}>
                  {copied ? (
                    <IoMdCheckmark className="w-3 h-3 sm:w-4 sm:h-4" />
                  ) : (
                    <MdContentCopy className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                </button>
              </pre>
            </div>
            <Button
              onClick={handleDownloadHTML}
              variant="outline"
              size="sm"
              className="bg-product-background text-xs">
              <FaCode className="w-3 h-3 sm:w-4 sm:h-4" /> Download HTML code
            </Button>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 md:pt-5 border-t border-product-border">
          {type === "edit" ? (
            <>
              <Button
                onClick={() => (window.location.href = "/admin/dashboard")}
                variant="outline"
                className="flex-1 text-xs bg-product-background sm:text-sm">
                <FiHome className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Return to Dashboard
              </Button>
              <Button
                onClick={() => window.open(fullURL, "_blank")}
                className="flex-1 text-xs sm:text-sm">
                <IoMdOpen className="w-3 h-3 sm:w-4 sm:h-4" /> View Catalogue
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => (window.location.href = "/admin/dashboard")}
                variant="outline"
                className="flex-1 text-xs bg-product-background sm:text-sm">
                <FiHome className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Return to Dashboard
              </Button>
              <Button
                onClick={() => window.open(fullURL, "_blank")}
                className="flex-1 text-xs sm:text-sm">
                <IoMdOpen className="w-3 h-3 sm:w-4 sm:h-4" /> View Catalogue
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SuccessModal
