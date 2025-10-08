import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LANGUAGE_OPTIONS } from "@/constants/ocr"
import { LanguageSelectorProps } from "@/types/components"
import React from "react"

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  touched,
  errors,
  detectedLanguage,
  onLanguageChange,
  type = "ai",
}) => {
  return (
    <div className="mb-6 w-full max-w-md">
      <label className="block text-sm font-medium text-product-foreground mb-2">
        {type === "ai" ? "Select Catalogue Language" : "Select Language of Images"}
        <span className="text-red-500 ml-1">*</span>
      </label>
      <Select value={selectedLanguage} onValueChange={(e) => onLanguageChange(e)}>
        <SelectTrigger>
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGE_OPTIONS.map((lang) => (
            <SelectItem key={lang.code} value={lang.name} className="cursor-pointer">
              {lang.flag} {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {detectedLanguage && selectedLanguage === "auto" && (
        <p className="mt-1 text-xs text-product-foreground-accent">
          Auto-detected: {LANGUAGE_OPTIONS.find((lang) => lang.code === detectedLanguage)?.name}
        </p>
      )}
      {touched?.language && errors?.language && (
        <div className="text-red-500 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded-lg font-body">
          {errors?.language}
        </div>
      )}
    </div>
  )
}
