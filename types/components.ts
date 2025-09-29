import {
  OverallAnalytics,
  PricingPlan,
  ServiceCatalogue,
  ServicesCategory,
  ServicesItem,
  Usage,
  User,
} from "@/types"
import { JSX } from "react"
import { ContactInfo, FooterData, ServicesFormData, UserData } from "."

export type ITestimonial = {
  name: string
  role: string
  message: string
  avatar: string
  industry?: string
  metric?: string
}

export type CookiePreferencesModalProps = {
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
}

export type IStats = {
  title: string
  icon: JSX.Element
  description: string
}

export type ISocials = {
  facebook?: string
  github?: string
  instagram?: string
  linkedin?: string
  threads?: string
  tiktok?: string
  twitter?: string
  youtube?: string
  x?: string
  [key: string]: string | undefined
}

export type SuccessModalProps = {
  isOpen: boolean
  onClose: () => void
  catalogueUrl: string
  type?: "regular" | "ai" | "edit"
}

export type CatalogueHeaderProps = {
  type?: "default" | "custom"
  logo?: string
  data?: {
    email?: string
    phone?: string
    ctaNavbar?: {
      enabled: boolean
      label: string
      url: string
    }
  }
}

export type CatalogueFooterProps = {
  type?: "default" | "custom"
  data?: FooterData
  logo: string
}

export type IFAQ = {
  question: string
  answer: string
}

export type ILinkItem = {
  text: string
  url: string
}

export type IBenefit = {
  title: string
  description: string
  imageSrc: string
  bullets: IBenefitBullet[]
}

export type IBenefitBullet = {
  title: string
  description: string
  icon: JSX.Element
}

export type ServicesFormBaseProps = {
  type: "create" | "edit"
  initialData?: ServicesFormData
  onSuccess?: (restaurantUrl: string) => void
  userData: UserData
}

export type Step1GeneralProps = {
  formData: {
    name: string
    theme?: string
    title?: string
    currency?: string
    subtitle?: string
  }
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | { target: { name: string; value: string } }
  ) => void
  setFormData: React.Dispatch<React.SetStateAction<any>>
  errors?: { [key: string]: string }
  touched?: { [key: string]: boolean }
  setTouched: any
  setErrors: any
  type?: string
}

export type Step2CategoriesProps = {
  formData: {
    services: ServicesCategory[]
  }
  handleAddCategory: () => void
  handleRemoveCategory: (index: number) => void
  handleCategoryChange: (index: number, field: "name" | "layout", value: string) => void
  handleReorderCategories?: (newOrder: ServicesCategory[]) => void
  expandedCategory: number | null
  setExpandedCategory: React.Dispatch<React.SetStateAction<number | null>>
}

export type Step3ItemsProps = {
  formData: ServiceCatalogue
  handleAddItem: (categoryIndex: number) => void
  handleRemoveItem: (categoryIndex: number, itemIndex: number) => void
  handleItemChange: (
    categoryIndex: number,
    itemIndex: number,
    field: keyof ServicesItem,
    value: string | number
  ) => void
  imagePreviews: { [key: string]: string }
  setImagePreviews: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>
  isUploading: boolean
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>
  expandedCategory: number | null
  setExpandedCategory: React.Dispatch<React.SetStateAction<number | null>>
  expandedItem: { categoryIndex: number; itemIndex: number } | null
  setExpandedItem: React.Dispatch<
    React.SetStateAction<{ categoryIndex: number; itemIndex: number } | null>
  >
}
export type Step5AppearanceProps = {
  formData: ServiceCatalogue
  setFormData: React.Dispatch<React.SetStateAction<ServicesFormData>>
}

export type Step4BrandingProps = {
  errors?: { [key: string]: string }
  setErrors: any
  formData: ServicesFormData
  userData: UserData
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | { target: { name: string; value: string } }
  ) => void
  handleAddContact: () => void
  handleRemoveContact: (index: number) => void
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>
  handleContactChange: (index: number, field: keyof ContactInfo, value: string) => void
  setFormData: React.Dispatch<React.SetStateAction<ServicesFormData>>
}

export type PromptExamplesProps = {
  setPrompt: (prompt: string) => void
  disabled?: boolean
}

export type LanguageSelectorProps = {
  selectedLanguage: string
  detectedLanguage: string
  onLanguageChange: (language: string) => void
}

export type DonutChartProps = {
  data: number[]
  labels: string[]
  title: string
  description: string
  icon: JSX.Element
}

export type AnalyticsProps = {
  data: { date: string; count: number }[]
  rawEvents: any[]
}

export type SubscriptionProps = {
  pricingPlan: PricingPlan
  subscriptionStartDate?: string
  subscriptionUpdatedDate?: string
}

export type DashboardProps = {
  user: User
  catalogues: ServiceCatalogue[]
  overallAnalytics: OverallAnalytics
  usage: Usage
  pricingPlan: PricingPlan
}

export type OverviewProps = {
  catalogues: ServiceCatalogue[]
  overallAnalytics: OverallAnalytics
  user: User
  refreshAll: any
  usage: Usage
  planId: number
}
