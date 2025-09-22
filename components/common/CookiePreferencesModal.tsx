// components/CookiePreferencesModal.tsx
"use client"

import { Button } from "@/components/ui/button"
import { CookiePreferencesModalProps } from "@/types/components"
import {
  loadPreferences,
  savePreferences,
  trackGTMEvent,
  updateGTMConsent,
  updateUserConsent,
} from "@/utils/cookies"
import { useUser } from "@clerk/nextjs"
import { Shield, X } from "lucide-react"
import { useState } from "react"
import FocusLock from "react-focus-lock"

const CookiePreferencesModal = ({ isOpen, onClose, onSave }: CookiePreferencesModalProps) => {
  const { user, isSignedIn } = useUser()
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false)
  const [marketingEnabled, setMarketingEnabled] = useState(false)

  useState(() => {
    const prefs = loadPreferences()
    setAnalyticsEnabled(prefs.analytics)
    setMarketingEnabled(prefs.marketing)
  })

  const handleSaveSettings = async () => {
    const prefs = savePreferences({
      accepted: true,
      analytics: analyticsEnabled,
      marketing: marketingEnabled,
    })

    // Update GTM consent
    updateGTMConsent(analyticsEnabled, marketingEnabled)

    await updateUserConsent(prefs, isSignedIn, user?.id)
    onClose()
    onSave?.()

    // Track save settings event
    trackGTMEvent("cookie_modal_save_settings", {
      consent_analytics: analyticsEnabled,
      consent_marketing: marketingEnabled,
    })
  }

  const handleAcceptAll = async () => {
    setAnalyticsEnabled(true)
    setMarketingEnabled(true)

    const prefs = savePreferences({
      accepted: true,
      analytics: true,
      marketing: true,
    })

    // Update GTM consent
    updateGTMConsent(true, true)

    await updateUserConsent(prefs, isSignedIn, user?.id)
    onClose()
    onSave?.()

    // Track accept all event
    trackGTMEvent("cookie_modal_accept_all")
  }

  const handleRejectAll = async () => {
    setAnalyticsEnabled(false)
    setMarketingEnabled(false)

    const prefs = savePreferences({
      accepted: true,
      analytics: false,
      marketing: false,
    })

    // Update GTM consent
    updateGTMConsent(false, false)

    await updateUserConsent(prefs, isSignedIn, user?.id)
    onClose()
    onSave?.()

    // Track reject all event
    trackGTMEvent("cookie_modal_reject_all")
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 rounded-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-settings-title">
      <FocusLock>
        <div className="bg-product-background rounded-lg shadow-lg max-w-lg w-full mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="relative p-6 text-center bg-hero-product-background">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-product-foreground-accent hover:text-product-foreground transition-colors"
              aria-label="Close cookie settings">
              <X className="w-5 h-5" />
            </button>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-product-primary">
                <Shield className="w-8 h-8 text-product-secondary" />
              </div>
            </div>
            <h2
              id="cookie-settings-title"
              className="text-xl font-semibold mb-2 text-product-foreground">
              Cookie Settings
            </h2>
            <p className="text-sm text-product-foreground-accent">Choose how we use your data</p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Your Rights:</strong> Withdraw consent anytime. If signed in, preferences
                sync with your account.
                <a href="/privacy" className="text-blue-600 hover:underline ml-1">
                  Privacy Policy
                </a>
              </p>
            </div>
            <div className="flex items-start justify-between p-4 rounded-lg bg-product-hover-background">
              <div className="flex-1 pr-3">
                <h3 className="text-sm font-medium text-product-foreground mb-1">
                  Essential Cookies
                </h3>
                <p className="text-xs text-product-foreground-accent leading-relaxed">
                  Needed for site security, login, and core features. Cannot be disabled.
                </p>
                <div className="mt-2 text-xs text-product-foreground-accent">
                  <strong>Examples:</strong> Sessions, tokens, accessibility, user details.
                </div>
              </div>
              <div className="flex-shrink-0">
                <input
                  type="checkbox"
                  checked
                  disabled
                  aria-label="Essential cookies always enabled"
                  className="w-4 h-4 text-product-primary bg-product-background border-product-border rounded focus:ring-product-primary"
                />
              </div>
            </div>
            <div className="flex items-start justify-between p-4 rounded-lg border border-product-border">
              <div className="flex-1 pr-3">
                <h3 className="text-sm font-medium text-product-foreground mb-1">Analytics</h3>
                <p className="text-xs text-product-foreground-accent leading-relaxed">
                  Anonymous data to improve site performance and fix issues.
                </p>
                <div className="mt-2 text-xs text-product-foreground-accent">
                  <strong>Examples:</strong> Google Analytics via GTM, page views, clicks, errors
                </div>
              </div>
              <div className="flex-shrink-0">
                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                  aria-label="Enable analytics cookies"
                  className="w-4 h-4 text-product-primary bg-product-background border-product-border rounded focus:ring-product-primary cursor-pointer"
                />
              </div>
            </div>
            <div className="flex items-start justify-between p-4 rounded-lg border border-product-border">
              <div className="flex-1 pr-3">
                <h3 className="text-sm font-medium text-product-foreground mb-1">Marketing</h3>
                <p className="text-xs text-product-foreground-accent leading-relaxed">
                  Personalized ads and content. May share data with partners.
                </p>
                <div className="mt-2 text-xs text-product-foreground-accent">
                  <strong>Examples:</strong> Ad pixels, retargeting, A/B tests, recommendations
                </div>
              </div>
              <div className="flex-shrink-0">
                <input
                  type="checkbox"
                  checked={marketingEnabled}
                  onChange={(e) => setMarketingEnabled(e.target.checked)}
                  aria-label="Enable marketing cookies"
                  className="w-4 h-4 text-product-primary bg-product-background border-product-border rounded focus:ring-product-primary cursor-pointer"
                />
              </div>
            </div>
            <div className="mt-6 p-3 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-xs text-gray-600">
                <strong>Retention:</strong> Analytics kept 26 months, marketing 13 months. You may
                request deletion anytime.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 pt-0">
            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button variant="default" onClick={handleSaveSettings} className="flex-1">
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      </FocusLock>
    </div>
  )
}

export default CookiePreferencesModal
