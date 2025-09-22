"use client"
import ImageDropzone from "@/components/common/ImageDropzone"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { contactTypes } from "@/constants"
import { Partner } from "@/types"
import type { Step4BrandingProps } from "@/types/components"
import { Lock, Plus, Tag, Trash2 } from "lucide-react"
import React, { useEffect } from "react"
import { IoDiamondOutline } from "react-icons/io5"

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^\+?[\d\s-]{7,15}$/
const urlRegex = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/.*)?$/

const Step4Branding: React.FC<Step4BrandingProps> = ({
  formData,
  userData,
  setIsUploading,
  handleInputChange,
  handleAddContact,
  handleRemoveContact,
  handleContactChange,
  setFormData,
  errors,
  setErrors,
}) => {
  const isFreePlan = userData?.pricing_plan.id === 0
  const isProPlan = userData?.pricing_plan.id === 1

  useEffect(() => {
    const newErrors: { [key: string]: string } = {}

    formData.partners?.forEach((partner, index) => {
      if (!partner.name.trim()) {
        newErrors[`partner-name-${index}`] = "Partner Name is required"
      }
      if (!partner.url.trim()) {
        newErrors[`partner-url-${index}`] = "Partner URL is required"
      } else if (!urlRegex.test(partner.url)) {
        newErrors[`partner-url-${index}`] = "Invalid URL format"
      }
    })

    if (formData.configuration?.ctaFooter?.enabled) {
      if (!formData.configuration.ctaFooter.label?.trim()) {
        newErrors["ctaFooter-label"] = "Footer Button Label is required"
      }
      if (!formData.configuration.ctaFooter.url?.trim()) {
        newErrors["ctaFooter-url"] = "Footer Button URL is required"
      } else if (!urlRegex.test(formData.configuration.ctaFooter.url)) {
        newErrors["ctaFooter-url"] = "Invalid URL format"
      }
    }

    if (formData.configuration?.ctaNavbar?.enabled) {
      if (!formData.configuration.ctaNavbar.label?.trim()) {
        newErrors["ctaNavbar-label"] = "Navbar Button Label is required"
      }
      if (!formData.configuration.ctaNavbar.url?.trim()) {
        newErrors["ctaNavbar-url"] = "Navbar Button URL is required"
      } else if (!urlRegex.test(formData.configuration.ctaNavbar.url)) {
        newErrors["ctaNavbar-url"] = "Invalid URL format"
      }
    }
    if (formData.configuration?.emailButtonNavbar) {
      const hasEmail = formData.contact?.some((contact) => contact.type === "email")
      if (!hasEmail) {
        newErrors["emailButtonNavbar"] =
          "Email contact must be added to enable Email Button in Navbar"
      }
    }

    formData.contact?.forEach((contact, index) => {
      if (!contact.value.trim()) {
        newErrors[`contact-value-${index}`] = `${contact.type} cannot be empty`
      } else {
        if (contact.type === "email" && !emailRegex.test(contact.value)) {
          newErrors[`contact-value-${index}`] = "Invalid email format"
        }
        if (contact.type === "phone" && !phoneRegex.test(contact.value)) {
          newErrors[`contact-value-${index}`] = "Invalid phone number format"
        }
        if (
          ["website", "facebook", "twitter", "instagram", "tiktok"].includes(contact.type) &&
          !urlRegex.test(contact.value)
        ) {
          newErrors[`contact-value-${index}`] = `Invalid ${contact.type} URL format`
        }
      }
    })

    if (
      formData.legal?.terms_and_conditions &&
      !urlRegex.test(formData.legal.terms_and_conditions)
    ) {
      newErrors["terms-and-conditions"] = "Invalid Terms & Conditions URL format"
    }
    if (formData.legal?.privacy_policy && !urlRegex.test(formData.legal.privacy_policy)) {
      newErrors["privacy-policy"] = "Invalid Privacy Policy URL format"
    }

    setErrors(newErrors)
  }, [formData, setErrors])

  const handleCtaChange = (
    ctaType: "ctaFooter" | "ctaNavbar",
    field: "url" | "label",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        [ctaType]: {
          ...prev.configuration?.[ctaType],
          [field]: value,
        },
      },
    }))
  }

  const handleToggle = (name: "ctaFooter" | "ctaNavbar" | "emailButtonNavbar" | "newsletter") => {
    setFormData((prev) => {
      if (name === "emailButtonNavbar") {
        return {
          ...prev,
          configuration: {
            ...prev.configuration,
            emailButtonNavbar: !prev.configuration?.emailButtonNavbar,
          },
        }
      } else if (name === "newsletter") {
        return {
          ...prev,
          configuration: {
            ...prev.configuration,
            newsletter: {
              enabled: !prev.configuration?.newsletter?.enabled,
            },
          },
        }
      } else {
        const isCurrentlyEnabled = prev.configuration?.[name]?.enabled || false
        return {
          ...prev,
          configuration: {
            ...prev.configuration,
            [name]: {
              enabled: !isCurrentlyEnabled,
              label: prev.configuration?.[name]?.label || "",
              url: prev.configuration?.[name]?.url || "",
            },
          },
        }
      }
    })
  }

  const handleLegalInfoChange = (
    field: "name" | "terms_and_conditions" | "privacy_policy" | "address",
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      legal: {
        ...prev.legal,
        [field]: value,
      },
    }))
  }

  const handleAddPartner = () => {
    if ((formData.partners?.length || 0) < 3) {
      setFormData((prev) => ({
        ...prev,
        partners: [
          ...(prev.partners || []),
          { name: "", description: "", logo: "", rating: 0, url: "" },
        ],
      }))
    }
  }

  const handleRemovePartner = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      partners: prev.partners?.filter((_, i) => i !== index),
    }))
  }

  const handlePartnerChange = (index: number, field: keyof Partner, value: string) => {
    setFormData((prev) => ({
      ...prev,
      partners: prev.partners?.map((partner, i) =>
        i === index ? { ...partner, [field]: value } : partner
      ),
    }))
  }

  const handlePartnerIconChange = (index: number, url: string) => {
    setFormData((prev) => ({
      ...prev,
      partners: prev.partners?.map((partner, i) =>
        i === index ? { ...partner, logo: url } : partner
      ),
    }))
  }

  const handleLogoUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, logo: url }))
    setIsUploading(false)
  }

  const handleLogoRemove = () => {
    setFormData((prev) => ({ ...prev, logo: "" }))
  }

  const usedContactTypes = formData.contact?.map((c) => c.type) || []

  return (
    <Card className="space-y-8 p-4 sm:p-4 bg-product-background/95 border-0 border-product-border shadow-md rounded-2xl">
      <h2 className="text-2xl sm:text-3xl font-bold text-product-foreground flex items-center gap-3 font-heading">
        <IoDiamondOutline className="text-product-primary" size={28} />
        Define Branding
      </h2>

      {isFreePlan && (
        <Alert className="border-amber-200 bg-amber-50">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-product-foreground">
            Branding customization is only available for paid plans. Upgrade your plan to customize
            your branding settings.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {(formData.legal?.name || !isFreePlan) && (
            <>
              <Label htmlFor="legal-name" className="text-product-foreground font-medium font-body">
                Legal Name
              </Label>
              <Input
                id="legal-name"
                name="legal.name"
                value={formData.legal?.name || ""}
                onChange={(e) => handleLegalInfoChange("name", e.target.value)}
                placeholder="e.g. Quicktalog Inc."
                className="border-product-border focus:border-product-primary focus:ring-product-primary/20"
              />
            </>
          )}
          {(formData.legal?.address || !isFreePlan) && (
            <>
              <Label htmlFor="address" className="text-product-foreground font-medium font-body">
                Address
              </Label>
              <Input
                id="address"
                name="legal.address"
                value={formData.legal?.address || ""}
                onChange={(e) => handleLegalInfoChange("address", e.target.value)}
                placeholder="e.g. 123 Main St, San Francisco, CA"
                className="border-product-border focus:border-product-primary focus:ring-product-primary/20"
              />
            </>
          )}
          {(formData.legal?.terms_and_conditions || !isFreePlan) && (
            <>
              <Label
                htmlFor="terms-and-conditions"
                className="text-product-foreground font-medium font-body">
                Terms & Conditions Link
              </Label>
              <Input
                id="terms-and-conditions"
                name="terms-and-conditions"
                value={formData.legal?.terms_and_conditions || ""}
                onChange={(e) => handleLegalInfoChange("terms_and_conditions", e.target.value)}
                placeholder="e.g. https://mywebsite.com/terms"
                className="border-product-border focus:border-product-primary focus:ring-product-primary/20"
              />
              {errors?.["terms-and-conditions"] && (
                <p className="text-red-500 text-sm">{errors["terms-and-conditions"]}</p>
              )}
            </>
          )}
          {(formData.legal?.privacy_policy || !isFreePlan) && (
            <>
              <Label
                htmlFor="privacy-policy"
                className="text-product-foreground font-medium font-body">
                Privacy Policy Link
              </Label>
              <Input
                id="privacy-policy"
                name="privacy-policy"
                value={formData.legal?.privacy_policy || ""}
                onChange={(e) => handleLegalInfoChange("privacy_policy", e.target.value)}
                placeholder="e.g. https://mywebsite.com/privacy"
                className="border-product-border focus:border-product-primary focus:ring-product-primary/20"
              />
              {errors?.["privacy-policy"] && (
                <p className="text-red-500 text-sm">{errors["privacy-policy"]}</p>
              )}
            </>
          )}
        </div>

        {(formData.logo || !isFreePlan) && (
          <div className="space-y-3">
            <Label htmlFor="logo" className="text-product-foreground font-medium font-body">
              Logo
            </Label>

            <ImageDropzone
              setIsUploading={setIsUploading}
              onUploadComplete={handleLogoUpload}
              onError={(error) => alert(`ERROR! ${error.message}`)}
              removeImage={handleLogoRemove}
              image={formData.logo}
              maxDim={512}
            />
          </div>
        )}

        {(formData.configuration?.ctaFooter?.enabled || !isFreePlan) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-product-foreground font-medium font-body">
                Button in Footer
              </Label>
              <Switch
                checked={!!formData.configuration?.ctaFooter?.enabled}
                onCheckedChange={() => handleToggle("ctaFooter")}
              />
            </div>
            {formData.configuration?.ctaFooter?.enabled && (
              <div className="space-y-3">
                <Input
                  placeholder="Label (e.g. Contact Us)"
                  value={formData.configuration.ctaFooter.label || ""}
                  onChange={(e) => handleCtaChange("ctaFooter", "label", e.target.value)}
                  className="border-product-border focus:border-product-primary focus:ring-product-primary/20"
                />
                {errors?.["ctaFooter-label"] && (
                  <p className="text-red-500 text-sm">{errors["ctaFooter-label"]}</p>
                )}
                <Input
                  placeholder="URL (e.g. https://mywebsite.com/contact)"
                  value={formData.configuration.ctaFooter.url || ""}
                  onChange={(e) => handleCtaChange("ctaFooter", "url", e.target.value)}
                  className="border-product-border focus:border-product-primary focus:ring-product-primary/20"
                />
                {errors?.["ctaFooter-url"] && (
                  <p className="text-red-500 text-sm">{errors["ctaFooter-url"]}</p>
                )}
              </div>
            )}
          </div>
        )}

        {(formData.configuration?.ctaNavbar?.enabled || !isFreePlan) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-product-foreground font-medium font-body">
                Button in Navbar
              </Label>
              <Switch
                checked={!!formData.configuration?.ctaNavbar?.enabled}
                onCheckedChange={() => handleToggle("ctaNavbar")}
              />
            </div>
            {formData.configuration?.ctaNavbar?.enabled && (
              <div className="space-y-3">
                <Input
                  placeholder="Label (e.g. Book Now)"
                  value={formData.configuration.ctaNavbar.label || ""}
                  onChange={(e) => handleCtaChange("ctaNavbar", "label", e.target.value)}
                  className="border-product-border focus:border-product-primary focus:ring-product-primary/20"
                />
                {errors?.["ctaNavbar-label"] && (
                  <p className="text-red-500 text-sm">{errors["ctaNavbar-label"]}</p>
                )}
                <Input
                  placeholder="URL (e.g. https://mywebsite.com/page)"
                  value={formData.configuration.ctaNavbar.url || ""}
                  onChange={(e) => handleCtaChange("ctaNavbar", "url", e.target.value)}
                  className="border-product-border focus:border-product-primary focus:ring-product-primary/20"
                />
                {errors?.["ctaNavbar-url"] && (
                  <p className="text-red-500 text-sm">{errors["ctaNavbar-url"]}</p>
                )}
              </div>
            )}
          </div>
        )}

        {(formData.configuration?.newsletter?.enabled || !isFreePlan) && (
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label className="text-product-foreground font-medium font-body">Newsletter</Label>
              <Switch
                checked={!!formData.configuration?.newsletter?.enabled}
                onCheckedChange={() => handleToggle("newsletter")}
                disabled={isFreePlan ? isFreePlan : isProPlan ? isProPlan : false}
              />
            </div>
          </div>
        )}

        {(formData.configuration?.emailButtonNavbar || !isFreePlan) && (
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label className="text-product-foreground font-medium font-body">
                Email button in Navbar
              </Label>
              <Switch
                checked={!!formData.configuration?.emailButtonNavbar}
                onCheckedChange={() => handleToggle("emailButtonNavbar")}
              />
            </div>
            {errors?.["emailButtonNavbar"] && (
              <p className="text-red-500 text-sm">{errors["emailButtonNavbar"]}</p>
            )}
          </div>
        )}

        {(formData.contact && formData.contact.length > 0) || !isFreePlan ? (
          <div className="space-y-6 col-span-full">
            <h3 className="text-xl font-bold text-product-foreground flex items-center gap-3 font-heading">
              <Tag className="h-6 w-6 text-product-primary" /> Contact Information
            </h3>
            {formData.contact?.map((contact, index) => (
              <div
                key={index}
                className="flex items-end gap-3 p-4 bg-product-background/50 rounded-xl border border-product-border">
                <div className="flex-grow space-y-2">
                  <Label htmlFor={`contact-type-${index}`} className="sr-only">
                    Contact Type
                  </Label>
                  <Select
                    value={contact.type}
                    onValueChange={(value) => handleContactChange(index, "type", value)}>
                    <SelectTrigger className="border-product-border focus:border-product-primary focus:ring-product-primary/20">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {contactTypes.map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                          disabled={
                            usedContactTypes.includes(type.value) && contact.type !== type.value
                          }>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-grow space-y-2">
                  <Label htmlFor={`contact-value-${index}`} className="sr-only">
                    Contact Value
                  </Label>
                  {errors?.[`contact-value-${index}`] && (
                    <p className="relative left-2 text-red-500 text-sm">
                      {errors[`contact-value-${index}`]}
                    </p>
                  )}
                  <Input
                    id={`contact-value-${index}`}
                    type="text"
                    placeholder="Enter value"
                    value={contact.value}
                    onChange={(e) => handleContactChange(index, "value", e.target.value)}
                    className="border-product-border focus:border-product-primary focus:ring-product-primary/20"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRemoveContact(index)}
                  className="h-10 w-10 hover:bg-red-600 hover:shadow-product-hover-shadow">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddContact}
              className="w-full py-3 text-base font-medium border-product-border hover:border-product-primary hover:bg-product-primary/5 transition-all duration-200"
              disabled={isFreePlan}>
              <Plus className="mr-2 h-5 w-5" /> Add Contact Field
            </Button>
          </div>
        ) : null}

        {(formData.partners && formData.partners.length > 0) || !isFreePlan ? (
          <div className="space-y-6 col-span-full">
            <h3 className="text-xl font-bold text-product-foreground flex items-center gap-3 font-heading">
              <Tag className="h-6 w-6 text-product-primary" /> Partners
            </h3>
            {formData.partners?.map((partner, index) => (
              <div
                key={index}
                className="flex flex-col gap-4 p-4 bg-product-background/50 rounded-xl border border-product-border">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemovePartner(index)}
                    className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {partner.url && (
                  <div className="relative mt-2 w-12 h-12 rounded-lg border-2 border-product-border overflow-hidden">
                    <img
                      src={`https://logo.clearbit.com/${partner.url}`}
                      alt="Partner Icon"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`partner-name-${index}`}>Partner Name</Label>
                    <Input
                      id={`partner-name-${index}`}
                      value={partner.name}
                      onChange={(e) => handlePartnerChange(index, "name", e.target.value)}
                      placeholder="Partner Name"
                    />
                    {errors?.[`partner-name-${index}`] && (
                      <p className="text-red-500 text-sm">{errors[`partner-name-${index}`]}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`partner-url-${index}`}>Partner URL</Label>
                    <Input
                      id={`partner-url-${index}`}
                      value={partner.url}
                      onChange={(e) => handlePartnerChange(index, "url", e.target.value)}
                      placeholder="https://partner.com"
                    />
                    {errors?.[`partner-url-${index}`] && (
                      <p className="text-red-500 text-sm">{errors[`partner-url-${index}`]}</p>
                    )}
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`partner-description-${index}`}>Description</Label>
                    <Input
                      id={`partner-description-${index}`}
                      value={partner.description}
                      onChange={(e) => handlePartnerChange(index, "description", e.target.value)}
                      placeholder="A short description of the partner."
                    />
                  </div>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={handleAddPartner}
              className="w-full py-3 text-base font-medium border-product-border hover:border-product-primary hover:bg-product-primary/5 transition-all duration-200"
              disabled={isFreePlan || (formData.partners?.length || 0) >= 3}>
              <Plus className="mr-2 h-5 w-5" /> Add Partner
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  )
}

export default Step4Branding
