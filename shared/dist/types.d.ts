import { layouts, themes } from "./constants";
export type Status = "active" | "inactive" | "draft";
export type CookiePreferences = {
    accepted: boolean;
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
    timestamp: string;
    version: string;
};
export type CategoryItem = {
    name: string;
    description: string;
    price: number;
    image: string;
};
export type Theme = {
    key: string;
    label: string;
    image: string;
    description: string;
};
export type Layout = Theme;
export type ThemeVariant = (typeof themes)[number]["key"];
export type LayoutVariant = (typeof layouts)[number]["key"];
export type CatalogueCategory = {
    order: number;
    name: string;
    layout: LayoutVariant;
    items: CategoryItem[];
};
export type Catalogue = {
    id?: string;
    name: string;
    status: Status;
    created_by?: string;
    theme: ThemeVariant;
    logo?: string;
    title: string;
    currency: string;
    contact?: ContactInfo[];
    subtitle?: string;
    services: CatalogueCategory[];
    partners?: Partner[];
    legal?: Legal;
    configuration?: Configuration;
    created_at?: string;
    updated_at?: string;
    source?: string;
};
export type ServicesFormData = Omit<Catalogue, "id" | "created_by" | "">;
export type Service = {
    name: string;
    image: string;
    price: number | string;
    description: string;
};
export type Legal = {
    name?: string;
    address?: string;
    terms_and_conditions?: string;
    privacy_policy?: string;
};
export type Partner = {
    name: string;
    logo: string;
    description: string;
    rating: number;
    url?: string;
};
export type Configuration = {
    ctaNavbar?: {
        enabled: boolean;
        label: string;
        url: string;
    };
    ctaFooter?: {
        enabled: boolean;
        label: string;
        url: string;
    };
    newsletter?: {
        enabled: boolean;
    };
};
export type Analytics = {
    date: string;
    current_url: string;
    pageview_count: number;
    unique_visitors: number;
};
export type User = {
    id: string;
    email: string | null;
    name: string | null;
    created_at: string;
    image: string | null;
    cookie_preferences?: CookiePreferences | null;
    plan_id: string | null;
    customer_id: string | null;
};
export type OCRImageData = {
    id: string;
    file: File;
    originalUrl: string;
    confidence?: number;
    isProcessed: boolean;
};
export type ContactInfo = {
    type: string;
    value: string;
};
export type Usage = {
    traffic: {
        pageview_count: number;
        unique_visitors: number;
    };
    ocr: number;
    prompts: number;
    catalogues: number;
};
export type UserData = User & {
    usage: Usage;
    currentPlan: PricingPlan;
    nextPlan: PricingPlan;
};
export type PricingPlan = {
    id: number;
    name: string;
    type: string;
    priceId: {
        month: string;
        year: string;
    };
    description: string;
    features: {
        support: string;
        catalogues: number;
        newsletter: boolean;
        custom_features: boolean;
        ocr_ai_import: number;
        traffic_limit: number;
        branding: boolean;
        analytics: string;
        ai_prompts: number;
        categories_per_catalogue?: number | "unlimited";
        items_per_catalogue?: number | "unlimited";
    };
    billing_period?: "month" | "year";
};
export type ContactData = {
    message: string;
    email: string;
    name: string;
    subject: string;
};
