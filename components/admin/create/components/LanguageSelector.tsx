import { LANGUAGE_OPTIONS } from "@/constants/ocr"
import { LanguageSelectorProps } from "@/types/components"
import React from "react"

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  detectedLanguage,
  onLanguageChange,
}) => {
  return (
    <div className="mb-6 w-full max-w-md">
      <label className="block text-sm font-medium text-product-foreground mb-2">
        Select Language of Images:
      </label>
      <select
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="w-full p-3 rounded-lg border border-product-border text-product-foreground focus:outline-none focus:ring-2 focus:ring-product-primary-accent">
        {LANGUAGE_OPTIONS.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
      {detectedLanguage && selectedLanguage === "auto" && (
        <p className="text-xs text-product-foreground-accent mt-1">
          Auto-detected: {LANGUAGE_OPTIONS.find((lang) => lang.code === detectedLanguage)?.name}
        </p>
      )}
    </div>
  )
}
