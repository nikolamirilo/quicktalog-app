"use client"
import { logOcrUsage } from "@/actions/usage"
import { Button } from "@/components/ui/button"
import { generateUniqueSlug } from "@/helpers/client"
import { revalidateData } from "@/helpers/server"
import { toast } from "@/hooks/use-toast"
import { OCRImageData } from "@/types"
import { detectLanguage, getLanguageParameters, preprocessImage } from "@/utils/ocr"
import { X } from "lucide-react"
import { useState } from "react"
import { createWorker, OEM } from "tesseract.js"
import { LanguageSelector } from "./LanguageSelector"

const OcrReader = ({ formData, setServiceCatalogueUrl, setShowSuccessModal }) => {
  const [images, setImages] = useState<OCRImageData[]>([])
  const [combinedText, setCombinedText] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState<string>("en")
  const [detectedLanguage, setDetectedLanguage] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState<number>(-1)

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files)
      const newImages: OCRImageData[] = newFiles.map((file, index) => ({
        id: `${Date.now()}-${index}`,
        file,
        originalUrl: URL.createObjectURL(file),
        isProcessed: false,
      }))

      setImages((prev) => [...prev, ...newImages])
      setCombinedText("") // Reset combined text when new images are added
    }
  }

  const removeImage = (imageId: string) => {
    setImages((prev) => {
      const imageToRemove = prev.find((img) => img.id === imageId)
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.originalUrl)
      }
      return prev.filter((img) => img.id !== imageId)
    })
    setCombinedText("") // Reset combined text when images are removed
  }

  const updateOCRImageData = (imageId: string, updates: Partial<OCRImageData>) => {
    setImages((prev) => prev.map((img) => (img.id === imageId ? { ...img, ...updates } : img)))
  }

  const processImage = async (OCRImageData: OCRImageData, index: number) => {
    setCurrentProcessingIndex(index)

    try {
      const preprocessedBlob = await preprocessImage(OCRImageData.file)

      if (!preprocessedBlob) {
        console.error(`Image preprocessing failed for image ${index + 1}`)
        return null
      }

      const imageToProcess = new File([preprocessedBlob], "processed-image.png", {
        type: "image/png",
      })

      // Determine which language to use
      let languageToUse = selectedLanguage

      // Handle Serbian Latin script mapping
      if (selectedLanguage === "srp_latn") {
        languageToUse = "hrv"
      }

      if (selectedLanguage === "auto") {
        // First pass with English to get some text for detection
        const quickWorker = await createWorker("eng")
        const quickResult = await quickWorker.recognize(imageToProcess)
        await quickWorker.terminate()

        const detectedLang = detectLanguage(quickResult.data.text)
        setDetectedLanguage(detectedLang)
        languageToUse = detectedLang
      }

      const worker = await createWorker(languageToUse, OEM.LSTM_ONLY)

      // Apply language-specific parameters
      const languageParams = getLanguageParameters(languageToUse)
      await worker.setParameters(languageParams)

      const {
        data: { text, confidence: ocrConfidence },
      } = await worker.recognize(imageToProcess)

      updateOCRImageData(OCRImageData.id, {
        confidence: ocrConfidence,
        isProcessed: true,
      })

      await worker.terminate()
      return text
    } catch (error) {
      console.error("Error during OCR recognition:", error)
      updateOCRImageData(OCRImageData.id, {
        confidence: 0,
        isProcessed: true,
      })
      return null
    }
  }

  const extractTextFromAllImages = async () => {
    if (images.length === 0) return

    setIsProcessing(true)
    setCombinedText("")
    const extractedTexts: string[] = []

    for (let i = 0; i < images.length; i++) {
      const OCRImageData = images[i]
      console.log(`Processing image ${i + 1} of ${images.length}`)
      const extractedText = await processImage(OCRImageData, i)

      if (extractedText && extractedText.trim()) {
        console.log(`Text extracted from image ${i + 1}:`, extractedText.substring(0, 100) + "...")
        extractedTexts.push(`--- Image ${i + 1} ---\n${extractedText.trim()}`)
      } else {
        console.log(`No text extracted from image ${i + 1}`)
        extractedTexts.push(`--- Image ${i + 1} ---\n[No text detected]`)
      }
    }

    setCurrentProcessingIndex(-1)
    setIsProcessing(false)

    console.log(`Total texts extracted: ${extractedTexts.length}`)

    // Combine all extracted texts
    const combinedExtractedText = extractedTexts.join("\n\n")
    console.log("Combined text length:", combinedExtractedText.length)
    setCombinedText(combinedExtractedText)

    // Log usage for all processed images
    await logOcrUsage()
    console.log("Usage assigned successfully.")
  }

  const handleSubmit = async () => {
    if (!combinedText.trim()) {
      toast({
        title: "No Text Found",
        description: "Please extract text from images first.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setServiceCatalogueUrl("")

    const slug = generateUniqueSlug(formData.name)
    const data = { ...formData, name: slug }
    try {
      const response = await fetch("/api/items/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ocr_text: combinedText, formData: data }),
      })

      if (response.ok) {
        const { restaurantUrl } = await response.json()
        setServiceCatalogueUrl(restaurantUrl)
        setShowSuccessModal(true)
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: `Failed to create showcase: ${errorData.error || "Unknown error"}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while processing the extracted text.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      await revalidateData()
    }
  }

  const allImagesProcessed = images.length > 0 && images.every((img) => img.isProcessed)
  const hasExtractedText = combinedText.trim().length > 0

  return (
    <div className="flex flex-col items-center text-product-foreground min-h-screen">
      <LanguageSelector
        selectedLanguage={selectedLanguage}
        detectedLanguage={detectedLanguage}
        onLanguageChange={setSelectedLanguage}
      />

      {/* Image Upload Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 sm:mb-8 items-center w-full max-w-lg">
        <label
          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-product-primary text-product-secondary font-semibold text-center cursor-pointer
                          transition-all duration-300 ease-in-out hover:bg-product-primary-accent hover:shadow-md hover:scale-105
                          focus-within:outline-none focus-within:ring-2 focus-within:ring-product-primary-accent focus-within:ring-opacity-50">
          Upload from Gallery
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="hidden"
          />
        </label>

        <label
          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-product-secondary text-product-primary font-semibold text-center cursor-pointer
                          transition-all duration-300 ease-in-out hover:bg-blue-800 hover:shadow-md hover:scale-105
                          focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-opacity-50">
          Open Camera App
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            className="hidden"
          />
        </label>
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="w-full max-w-6xl mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-product-foreground">
              Selected Images ({images.length})
            </h2>
            {isProcessing && (
              <div className="text-sm text-product-foreground-accent">
                Processing image {currentProcessingIndex + 1} of {images.length}...
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((OCRImageData, index) => (
              <div key={OCRImageData.id} className="relative">
                <div className="p-3 rounded-xl border border-product-border bg-hero-product-background shadow-product">
                  {/* Remove button */}
                  <button
                    onClick={() => removeImage(OCRImageData.id)}
                    className="absolute -top-2 -right-2 z-10 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    disabled={isProcessing}>
                    <X size={14} />
                  </button>

                  {/* Processing indicator */}
                  {currentProcessingIndex === index && (
                    <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                      Processing
                    </div>
                  )}

                  <div className="text-center">
                    <p className="text-xs font-semibold mb-2 text-product-foreground">
                      Image {index + 1}
                    </p>

                    {/* Image preview */}
                    <img
                      src={OCRImageData.originalUrl}
                      alt={`Content ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg mb-2"
                    />

                    {/* Confidence badge */}
                    {OCRImageData.isProcessed && (
                      <div className="flex justify-center">
                        {OCRImageData.confidence !== undefined && OCRImageData.confidence > 0 ? (
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              OCRImageData.confidence > 80
                                ? "bg-green-100 text-green-800"
                                : OCRImageData.confidence > 60
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}>
                            {OCRImageData.confidence.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                            Failed
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <Button
          onClick={extractTextFromAllImages}
          disabled={images.length === 0 || isProcessing || isSubmitting}
          variant="file-action"
          className={
            images.length > 0 && !isProcessing && !isSubmitting
              ? "bg-product-primary text-product-secondary hover:bg-product-primary-accent hover:shadow-product-hover hover:scale-105 cursor-pointer"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }>
          {isProcessing
            ? "Extracting Text..."
            : `Extract Text from ${images.length} Image${images.length !== 1 ? "s" : ""}`}
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={!hasExtractedText || isProcessing || isSubmitting}
          variant="file-action"
          className={
            hasExtractedText && !isProcessing && !isSubmitting
              ? "bg-green-600 text-white hover:bg-green-700 hover:shadow-product-hover hover:scale-105 cursor-pointer"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }>
          {isSubmitting ? "Creating Catalogue..." : "Create Catalogue"}
        </Button>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
        <div className="p-6 rounded-xl border border-product-border bg-hero-product-background shadow-product">
          <h3 className="font-bold text-xl mb-4 text-product-foreground">Processing Summary</h3>
          <div className="space-y-2">
            <p className="text-product-foreground-accent">Images selected: {images.length}</p>
            <p className="text-product-foreground-accent">
              Images processed: {images.filter((img) => img.isProcessed).length}
            </p>
            <p className="text-product-foreground-accent">
              Text extracted: {hasExtractedText ? "✓ Yes" : "✗ No"}
            </p>
            {isProcessing && (
              <p className="text-blue-600">
                Currently processing: Image {currentProcessingIndex + 1} of {images.length}
              </p>
            )}
            {isSubmitting && <p className="text-green-600">Creating service catalogue...</p>}
          </div>
        </div>

        <div className="p-6 rounded-xl border border-product-border bg-hero-product-background shadow-product">
          <h3 className="font-bold text-xl mb-4 text-product-secondary">Extracted Text</h3>
          <div className="border border-product-border bg-hero-product-background p-4 rounded-lg text-left text-product-foreground-accent break-words whitespace-pre-wrap min-h-[200px] max-h-[400px] overflow-auto">
            {combinedText ? (
              <div>
                {combinedText.split("\n").map((line, index) => (
                  <div key={index}>
                    {line.startsWith("--- Image") ? (
                      <div className="text-blue-600 font-semibold my-2 border-b border-blue-200 pb-1">
                        {line}
                      </div>
                    ) : line === "[No text detected]" ? (
                      <div className="text-red-500 italic">{line}</div>
                    ) : (
                      <div>{line}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-product-foreground-accent opacity-60 italic">
                {allImagesProcessed
                  ? "No text was extracted from the images."
                  : "Extracted text from all images will appear here..."}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default OcrReader
