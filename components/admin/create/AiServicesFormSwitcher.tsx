"use client"

import { sendNewCatalogueEmail } from "@/actions/email"
import LimitsModal from "@/components/modals/LimitsModal"
import SuccessModal from "@/components/modals/SuccessModal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { revalidateData } from "@/helpers/server"
import { toast } from "@/hooks/use-toast"
import { UserData } from "@/types"
import { useUser } from "@clerk/nextjs"
import Link from "next/link"
import React, { useState } from "react"
import { RiSparkling2Line } from "react-icons/ri"
import PromptExamples from "./components/ai/PromptExamples"
import PromptInput from "./components/ai/PromptInput"
import OcrReader from "./components/ocr/OcrReader"
import Step1General from "./components/Step1General"

interface AiServicesFormSwitcherProps {
  type: "ai_prompt" | "ocr_import"
  userData: UserData
}

export default function AiServicesFormSwitcher({ type, userData }: AiServicesFormSwitcherProps) {
  const [formData, setFormData] = useState({
    name: "",
    theme: "",
    title: "",
    currency: "",
    subtitle: "",
  })
  const [prompt, setPrompt] = useState("")
  const { user } = useUser()
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [catalogueUrl, setCatalogueUrl] = useState("")
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showLimitsModal, setShowLimitsModal] = useState(false)

  const handleInputChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | { target: { name: string; value: string } }
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const validate = () => {
    const newErrors: { [key: string]: string } = {}
    const hasErrors = Object.keys(errors).length > 0
    if (!formData.name.trim()) newErrors.name = "Name is required."
    if (!formData.title.trim()) newErrors.title = "Title is required."
    if (!formData.currency.trim()) newErrors.currency = "Currency is required."
    if (!formData.theme.trim()) newErrors.theme = "Theme is required."
    if (type === "ai_prompt" && !prompt.trim())
      newErrors.prompt = "Services description is required."
    setErrors(newErrors)
    setTouched({
      name: true,
      title: true,
      currency: true,
      theme: true,
      ...(type === "ai_prompt" && { prompt: true }),
    })
    return Object.keys(newErrors).length === 0 && !hasErrors
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!validate()) return

    if (!user || !user.id) {
      toast({
        title: "Authentication Error",
        description: "You must be signed in to create a service catalogue.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setCatalogueUrl("")

    try {
      if (
        userData.usage.prompts >= userData.pricing_plan.features.ai_catalogue_generation ||
        userData.usage.catalogues >= userData.pricing_plan.features.catalogues
      ) {
        setShowLimitsModal(true)
        setIsSubmitting(false)
        return
      }

      const response = await fetch("/api/items/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData: formData, prompt }),
      })

      const contactData = {
        email: user.emailAddresses[0]?.emailAddress || "",
        name: user.firstName || "",
      }

      if (response.ok) {
        const { catalogueUrl, slug } = await response.json()
        setCatalogueUrl(catalogueUrl)
        await sendNewCatalogueEmail(contactData, formData.name, slug)
        setShowSuccessModal(true)
        toast({
          title: "Success!",
          description: (
            <p>
              Your digital showcase has been created. You can view it at{" "}
              <Link href={catalogueUrl} className="text-primary-accent hover:underline">
                {catalogueUrl}
              </Link>
            </p>
          ),
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: `Failed to create showcase: ${errorData.error || "Unknown error"}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Submission error:", error)
      toast({
        title: "Error",
        description: "An error occurred while submitting the request.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      await revalidateData()
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-product-background/95 border border-product-border shadow-md rounded-3xl my-24 md:my-16">
      <Card
        className="w-full h-full bg-transparent border-0 shadow-none rounded-none backdrop-blur-none"
        type="form">
        <CardHeader className="p-6 sm:p-8">
          <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-product-foreground font-heading">
            {type === "ai_prompt"
              ? "AI Business Catalogue Generator"
              : "Catalogue OCR import"}
          </CardTitle>
          <CardDescription className="text-center text-product-foreground-accent text-base sm:text-lg mt-2 font-body">
            {type === "ai_prompt"
              ? "Generate stunning service catalogues"
              : "Import your existing service catalogues"}{" "}
            of your services in minutes. Perfect for restaurants, salons, gyms, and more.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 pt-0">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Step1General
              formData={formData}
              handleInputChange={handleInputChange}
              setFormData={setFormData}
              errors={errors}
              touched={touched}
              setTouched={setTouched}
              setErrors={setErrors}
            />

            {type === "ai_prompt" ? (
              <>
                <PromptInput
                  prompt={prompt}
                  touched={touched}
                  errors={errors}
                  setPrompt={setPrompt}
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="cta"
                  className="h-12 font-medium rounded-lg">
                  {isSubmitting ? (
                    <div className="flex items-center gap-2 animate-pulse">
                      <RiSparkling2Line size={20} className="animate-spin" />
                      Creating Your Catalogue...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <RiSparkling2Line size={20} />
                      Generate Catalogue
                    </div>
                  )}
                </Button>
              </>
            ) : type === "ocr_import" ? (
              <OcrReader
                formData={formData}
                setShowSuccessModal={setShowSuccessModal}
                setServiceCatalogueUrl={setCatalogueUrl}
              />
            ) : null}
          </form>
          {type === "ai_prompt" && <PromptExamples setPrompt={setPrompt} disabled={isSubmitting} />}
        </CardContent>
      </Card>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        catalogueUrl={catalogueUrl}
        type="ai"
      />
      {showLimitsModal && (
        <LimitsModal
          type="ai"
          currentPlan={userData?.pricing_plan?.name}
          requiredPlan={userData?.pricing_plan?.next_plan}
        />
      )}
    </div>
  )
}
