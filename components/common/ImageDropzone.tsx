"use client"
import { UploadDropzone } from "@/utils/uploadthing"
import NextImage from "next/image"
import React, { useCallback } from "react"
import { FiUploadCloud } from "react-icons/fi"
import { IoClose } from "react-icons/io5"

const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    const cleanup = () => URL.revokeObjectURL(url)

    img.onload = () => {
      cleanup()
      resolve(img)
    }

    img.onerror = () => {
      cleanup()
      reject(new Error(`Failed to load image: ${file.name}`))
    }

    img.src = url
  })
}

const calculateDimensions = (width: number, height: number, maxDim: number) => {
  if (width <= maxDim && height <= maxDim) {
    return { width, height }
  }

  const aspectRatio = width / height

  if (width > height) {
    return {
      width: maxDim,
      height: Math.round(maxDim / aspectRatio),
    }
  } else {
    return {
      width: Math.round(maxDim * aspectRatio),
      height: maxDim,
    }
  }
}

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error("Failed to convert canvas to blob"))
        }
      },
      "image/webp",
      quality
    )
  })
}

const processImage = async (
  img: HTMLImageElement,
  maxDim: number,
  targetSizeKB: number = 400,
  fileName: string
): Promise<File> => {
  const { width, height } = calculateDimensions(img.width, img.height, maxDim)

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext("2d", {
    alpha: false,
    willReadFrequently: false,
    desynchronized: true,
  })

  if (!ctx) {
    throw new Error("Failed to get 2D rendering context")
  }

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = "high"

  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(0, 0, width, height)

  ctx.drawImage(img, 0, 0, width, height)

  const targetSizeBytes = targetSizeKB * 1024
  const maxSizeBytes = targetSizeKB * 1024 // Enforce strict 400KB limit

  let minQuality = 0.3
  let maxQuality = 0.98
  let bestBlob: Blob | null = null
  let bestQuality = minQuality

  let currentBlob = await canvasToBlob(canvas, maxQuality)

  if (currentBlob.size <= targetSizeBytes) {
    bestBlob = currentBlob
    bestQuality = maxQuality
  } else {
    let searchMin = minQuality
    let searchMax = maxQuality

    for (let i = 0; i < 8; i++) {
      const midQuality = (searchMin + searchMax) / 2
      const testBlob = await canvasToBlob(canvas, midQuality)

      if (testBlob.size <= targetSizeBytes) {
        if (
          testBlob.size > (bestBlob?.size || 0) ||
          Math.abs(testBlob.size - targetSizeBytes) <
            Math.abs((bestBlob?.size || 0) - targetSizeBytes)
        ) {
          bestBlob = testBlob
          bestQuality = midQuality
        }
        searchMin = midQuality
      } else {
        searchMax = midQuality
      }
    }
  }

  if (!bestBlob) {
    bestBlob = await canvasToBlob(canvas, 0.1)
    bestQuality = 0.1
  }

  if (bestBlob.size > maxSizeBytes) {
    throw new Error(
      `Processed image size (${Math.round(bestBlob.size / 1024)}KB) exceeds maximum allowed size of ${targetSizeKB}KB`
    )
  }

  console.log(`Image processing results:
    - Original: ~${Math.round((img.naturalWidth * img.naturalHeight * 4) / 1024)}KB (estimated)
    - Compressed: ${Math.round(bestBlob.size / 1024)}KB
    - Quality: ${Math.round(bestQuality * 100)}%
    - Dimensions: ${width}x${height}
    - Target: ${targetSizeKB}KB`)

  const newFileName = fileName.replace(/\.[^.]+$/, ".webp")

  return new File([bestBlob], newFileName, {
    type: "image/webp",
    lastModified: Date.now(),
  })
}

interface ImageDropzoneProps {
  setIsUploading: React.Dispatch<boolean>
  onUploadComplete: (url: string) => void
  onError?: (error: Error) => void
  maxDim?: number
  targetSizeKB?: number
  className?: string
  disabled?: boolean
  removeImage: () => void
  image: string
}

const ImageDropzone: React.FC<ImageDropzoneProps> = ({
  setIsUploading,
  removeImage,
  image,
  onUploadComplete,
  onError,
  maxDim = 1024,
  targetSizeKB = 400,
  className = "",
  disabled = false,
}) => {
  const handleBeforeUploadBegin = useCallback(
    async (files: File[]): Promise<File[]> => {
      if (disabled || files.length === 0) return []

      const file = files[0]

      try {
        if (!file.type.startsWith("image/")) {
          throw new Error("Please select a valid image file")
        }

        if (file.size > 50 * 1024 * 1024) {
          throw new Error("File is too large. Please select a smaller image")
        }

        const img = await loadImage(file)
        const processedFile = await processImage(img, maxDim, targetSizeKB, file.name)

        return [processedFile]
      } catch (error) {
        console.error("Image processing error:", error)

        if (onError) {
          onError(error instanceof Error ? error : new Error("Unknown error occurred"))
        } else {
          alert(error instanceof Error ? error.message : "Failed to process image")
        }

        return []
      }
    },
    [disabled, maxDim, targetSizeKB, onError]
  )

  const handleUploadComplete = useCallback(
    (res: any[]) => {
      try {
        if (res && res.length > 0 && res[0]?.url) {
          onUploadComplete(res[0].url)
        } else {
          throw new Error("No URL received from upload service")
        }
      } catch (error) {
        console.error("Upload completion error:", error)
        if (onError) {
          onError(error instanceof Error ? error : new Error("Upload completion failed"))
        }
      }
    },
    [onUploadComplete, onError]
  )

  const handleUploadError = useCallback(
    (error: Error) => {
      console.error("Upload error:", error)
      if (onError) {
        onError(error)
      }
    },
    [onError]
  )

  return (
    <div translate="no" className="notranslate">
      {image ? (
        <div className="relative mt-2 w-48 h-48 rounded-lg border-2 border-product-border overflow-hidden bg-product-background shadow-product-shadow">
          <NextImage
            src={image}
            alt="Uploaded image preview"
            fill
            className="object-cover opacity-0 transition-opacity duration-500 ease-in-out"
            onLoadingComplete={(img) => {
              img.classList.remove("opacity-0")
            }}
          />
          <button
            onClick={removeImage}
            translate="no"
            className="absolute top-2 right-2 z-10 bg-red-500 text-white rounded-full cursor-pointer hover:bg-red-600 transition-colors duration-200 shadow-lg">
            <IoClose size={25} />
          </button>
        </div>
      ) : (
        <div className="relative cursor-pointer">
          <UploadDropzone
            endpoint="imageUploader"
            config={{ mode: "auto" }}
            className={className}
            disabled={disabled}
            onUploadBegin={() => {
              setIsUploading(true)
            }}
            appearance={{
              button: "hidden",
              label: "text-gray-600 hover:text-product-primary",
              container: `h-48 w-full`,
            }}
            content={{
              label: ({ ready, isUploading }) => {
                if (ready && !isUploading)
                  return (
                    <span translate="no" className="notranslate">
                      Choose a file or Drag & Drop
                    </span>
                  )
                if (isUploading)
                  return (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="animate-spin rounded-full h-14 w-14 border-b-2 border-product-primary"></span>
                    </div>
                  )
                return (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="animate-spin rounded-full h-14 w-14 border-b-4 border-product-primary"></span>
                  </div>
                )
              },
              uploadIcon: ({ ready, isUploading }) => {
                if (ready && !isUploading) return <FiUploadCloud size={40} color="#ffc017" />
                if (isUploading) return ""
                return ""
              },
              allowedContent: ({ ready, isUploading }) => {
                if (ready && !isUploading)
                  return (
                    <span translate="no" className="notranslate">
                      Image (PNG, JPG, WebP, …, max 400KB)
                    </span>
                  )
                if (isUploading) return ""
                return ""
              },
            }}
            onBeforeUploadBegin={handleBeforeUploadBegin}
            onClientUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
          />
        </div>
      )}
    </div>
  )
}

export default ImageDropzone
