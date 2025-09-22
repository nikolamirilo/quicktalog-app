import { COOKIE_KEY } from "@/constants"
import { CookiePreferences } from "@/types"

export const defaultPreferences: CookiePreferences = {
  accepted: false,
  essential: true,
  analytics: false,
  marketing: false,
  timestamp: "",
  version: "1.1",
}

export function loadPreferences(): CookiePreferences {
  if (typeof window === "undefined") return defaultPreferences
  const raw = localStorage.getItem(COOKIE_KEY)
  return raw ? { ...defaultPreferences, ...JSON.parse(raw) } : defaultPreferences
}

export function savePreferences(prefs: Partial<CookiePreferences>): CookiePreferences {
  if (typeof window === "undefined") return defaultPreferences
  const newPrefs: CookiePreferences = {
    ...defaultPreferences,
    ...loadPreferences(),
    ...prefs,
    timestamp: new Date().toISOString(),
  }
  localStorage.setItem(COOKIE_KEY, JSON.stringify(newPrefs))
  return newPrefs
}

export function updateGTMConsent(analytics: boolean, marketing: boolean) {
  // Update GTM consent for existing dataLayer
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event: "consent_update",
      consent: {
        analytics_storage: analytics ? "granted" : "denied",
        ad_storage: marketing ? "granted" : "denied",
        ad_user_data: marketing ? "granted" : "denied",
        ad_personalization: marketing ? "granted" : "denied",
        functionality_storage: "granted",
        security_storage: "granted",
      },
    })
  }
}

export function initializeGTMConsent() {
  // Initialize default consent state for GTM
  if (typeof window !== "undefined") {
    if (!window.dataLayer) {
      window.dataLayer = []
    }

    // Set default consent to denied
    window.dataLayer.push({
      event: "consent_default",
      consent: {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        functionality_storage: "granted",
        security_storage: "granted",
        wait_for_update: 2000,
      },
    })
  }
}

export function trackGTMEvent(eventName: string, additionalData?: Record<string, any>) {
  if (typeof window !== "undefined" && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...additionalData,
    })
  }
}

export async function updateUserConsent(
  prefs: CookiePreferences,
  isSignedIn: boolean,
  userId?: string
) {
  if (!isSignedIn || !userId) return
  try {
    const response = await fetch("/api/update-consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cookieConsent: prefs }),
    })
    if (!response.ok) {
      throw new Error("Failed to update consent")
    }
  } catch (error) {
    console.error("Error updating user consent:", error)
  }
}
