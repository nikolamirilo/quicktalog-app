"use client"
import InformModal from "@/components/modals/InformModal"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { themes } from "@/constants"
import type { Step1GeneralProps } from "@/types/components"
import { AlertCircle, CheckCircle, FileText } from "lucide-react"
import React, { useEffect, useMemo, useState } from "react"
import { FiInfo } from "react-icons/fi"
import { CurrencySelect } from "./common/CurrencySelect"

const Step1General: React.FC<Step1GeneralProps> = ({
  formData,
  handleInputChange,
  setFormData,
  errors = {},
  touched = {},
  setErrors,
  setTouched,
  type,
}) => {
  const [names, setNames] = useState([])
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false)
  const [currentField, setCurrentField] = useState("")

  const normalize = (str: string) => str.trim().toLowerCase().replace(/\s+/g, "-")

  const nameExists = useMemo(() => {
    if (type !== "create" || !formData.name || !names.length) return false
    return names.some((n) => normalize(n.name) === normalize(formData.name))
  }, [formData.name, names, type])

  const handleThemeChange = (value: string) => {
    setFormData((prev: any) => ({ ...prev, theme: value }))
  }

  const handleCurrencyChange = (value: string) => {
    setFormData((prev: any) => ({ ...prev, currency: value }))
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value

    handleInputChange(e)

    if (setTouched) {
      setTouched((prev: any) => ({ ...prev, name: true }))
    }

    const isValid = /^[a-zA-Z0-9\s]*$/.test(newName)

    if (!isValid && setErrors) {
      setErrors((prev: any) => ({
        ...prev,
        name: "Name must only contain letters, numbers, and spaces (no special characters).",
      }))
      return // stop further duplicate checks if invalid
    } else if (isValid && setErrors) {
      // clear only this specific error if user fixes it
      setErrors((prev: any) => {
        const newErrors = { ...prev }
        if (
          newErrors.name ===
          "Name must only contain letters, numbers, and spaces (no special characters)."
        ) {
          delete newErrors.name
        }
        return newErrors
      })
    }

    // Existing duplicate check (only in create flow)
    if (type === "create") {
      if (newName.trim() && names.length > 0) {
        const exists = names.some((n) => normalize(n.name) === normalize(newName))

        if (exists && setErrors) {
          setErrors((prev: any) => ({
            ...prev,
            name: "This name is already in use. Please choose a different name.",
          }))
        } else if (!exists && setErrors) {
          // Clear only duplicate error
          setErrors((prev: any) => {
            const newErrors = { ...prev }
            if (newErrors.name === "This name is already in use. Please choose a different name.") {
              delete newErrors.name
            }
            return newErrors
          })
        }
      } else if (!newName.trim() && setErrors) {
        // Clear duplicate error if empty
        setErrors((prev: any) => {
          const newErrors = { ...prev }
          if (newErrors.name === "This name is already in use. Please choose a different name.") {
            delete newErrors.name
          }
          return newErrors
        })
      }
    }
  }

  useEffect(() => {
    if (type !== "create") return

    async function getAllNames() {
      try {
        const res = await fetch("/api/items", {
          method: "GET",
          cache: "no-store",
        })
        const data = await res.json()
        // Set names state immediately with the fetched data
        setNames(data)
        if (formData.name && data.length > 0) {
          const exists = data.some((n) => normalize(n.name) === normalize(formData.name))
          if (exists && setErrors) {
            setErrors((prev: any) => ({
              ...prev,
              name: "This name is already in use. Please choose a different name.",
            }))
          }
        }
      } catch (error) {
        console.error("Failed to fetch names:", error)
        setNames([])
      }
    }
    getAllNames()
  }, [type])

  const getFieldExplanation = (field: string): string => {
    const explanations: { [key: string]: string } = {
      "catalog-name": "This is your catalog's unique identifier that appears in the URL (e.g., quicktalog.app/catalogues/your-catalog-name) and is displayed on your dashboard. It must be unique and can only contain letters, numbers, and spaces. This name helps you identify your catalog in the admin panel.",
      "catalog-title": "This is the main heading that visitors will see at the top of your catalog page. It's the prominent title that introduces your services to customers and appears as the main heading on your public catalog page."
    }
    return explanations[field] || "Information about this field."
  }

  const handleInfoClick = (field: string) => {
    setCurrentField(field)
    setIsInfoModalOpen(true)
  }

  return (
    <Card
      className="space-y-8 p-4 sm:p-4 bg-product-background/95 border-0 border-product-border shadow-md rounded-2xl"
      type="form">
      <h2 className="text-2xl sm:text-3xl font-bold text-product-foreground flex items-center gap-3 font-heading">
        <FileText className="text-product-primary" size={28} />
        General Information
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="name" className="text-product-foreground font-medium font-body">
              Catalogue Name<span className="text-red-500 ml-1">*</span>
            </Label>
            <button
              type="button"
              onClick={() => handleInfoClick("catalog-name")}
              className="hover:text-product-primary transition-colors duration-200 z-10">
              <FiInfo size={16} />
            </button>
          </div>
          <div className="relative">
            <Input
              id="name"
              type="text"
              disabled={type === "edit" ? true : false}
              name="name"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="e.g., Five Guys"
              className={`border-product-border focus:border-product-primary focus:ring-product-primary/20 text-sm sm:text-base pr-10 ${
                errors?.name
                  ? "border-red-500 focus:border-red-500"
                  : formData.name && !nameExists && touched?.name && type === "create"
                    ? "border-green-500 focus:border-green-500"
                    : ""
              }`}
              required
            />
            {/* Real-time validation icon - only show in create flow */}
            {formData.name && touched?.name && type === "create" && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {errors?.name ? (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
            )}
          </div>

          {/* Show success message when name is unique and touched - only in create flow */}
          {formData.name && !errors?.name && touched?.name && type === "create" && (
            <div className="text-green-600 text-sm mt-2 p-2 bg-green-50 border border-green-200 rounded-lg font-body flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Great! This name is available.
            </div>
          )}

          {/* Show all validation errors (including duplicate name error) */}
          {touched?.name && errors?.name && (
            <div className="text-red-500 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded-lg font-body flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {errors.name}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="title" className="text-product-foreground font-medium font-body">
              Catalogue Title<span className="text-red-500 ml-1">*</span>
            </Label>
            <button
              type="button"
              onClick={() => handleInfoClick("catalog-title")}
              className="hover:text-product-primary transition-colors duration-200 z-10">
              <FiInfo size={16} />
            </button>
          </div>
          <Input
            id="title"
            type="text"
            name="title"
            value={formData.title || ""}
            onChange={handleInputChange}
            placeholder="e.g., Our Delicious Offerings"
            className="border-product-border focus:border-product-primary focus:ring-product-primary/20 text-sm sm:text-base"
          />
          {touched?.title && errors?.title && (
            <div className="text-red-500 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded-lg font-body">
              {errors.title}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="subtitle" className="text-product-foreground font-medium font-body">
            Catalogue Description
          </Label>
          <Textarea
            id="subtitle"
            name="subtitle"
            value={formData.subtitle || ""}
            onChange={handleInputChange}
            placeholder="A short tagline or description"
            className="h-32 border-product-border focus:border-product-primary focus:ring-product-primary/20 text-sm sm:text-base"
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="currency" className="text-product-foreground font-medium font-body">
            Currency (e.g., USD, EUR)<span className="text-red-500 ml-1">*</span>
          </Label>
          <CurrencySelect value={formData.currency} onChange={handleCurrencyChange} />
          {touched?.currency && errors?.currency && (
            <div className="text-red-500 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded-lg font-body">
              {errors.currency}
            </div>
          )}
        </div>

        <div className="space-y-4 col-span-full">
          <Label htmlFor="theme" className="text-product-foreground font-medium font-body">
            Theme<span className="text-red-500 ml-1">*</span>
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {themes.map((themeOption) => (
              <div
                key={themeOption.key}
                className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-product-hover-shadow ${
                  formData.theme === themeOption.key
                    ? "border-product-primary shadow-product-shadow bg-product-primary/5"
                    : "border-product-border hover:border-product-primary/50"
                }`}
                onClick={() => handleThemeChange(themeOption.key)}>
                <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-100">
                  <img
                    src={themeOption.image}
                    alt={themeOption.label}
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-center text-base mt-3 font-medium text-product-foreground font-body">
                  {themeOption.label}
                </p>
              </div>
            ))}
          </div>
          {touched?.theme && errors?.theme && (
            <div className="text-red-500 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded-lg font-body">
              {errors.theme}
            </div>
          )}
        </div>
      </div>

      <InformModal
        isOpen={isInfoModalOpen}
        onConfirm={() => setIsInfoModalOpen(false)}
        onCancel={() => setIsInfoModalOpen(false)}
        title={`${currentField.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Explained`}
        message={getFieldExplanation(currentField)}
        confirmText="Got it!"
        cancelText=""
      />
    </Card>
  )
}

export default Step1General
