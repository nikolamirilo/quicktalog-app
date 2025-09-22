"use client"
import ConsentModal from "@/components/modals/ConsentModal"
import { SignIn, SignUp } from "@clerk/nextjs"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function Auth() {
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode")
  const router = useRouter()
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [showSignupForm, setShowSignupForm] = useState(false)

  useEffect(() => {
    if (mode === "signup") {
      const consent = localStorage.getItem("consent")
      if (consent === "true") {
        setShowSignupForm(true)
      } else {
        setShowConsentModal(true)
      }
    } else {
      setShowSignupForm(true)
    }
  }, [mode])

  const handleConsentConfirm = () => {
    setShowConsentModal(false)
    setShowSignupForm(true)
  }

  const handleConsentCancel = () => {
    setShowConsentModal(false)
    router.push("/")
  }

  return (
    <>
      <div className="product font-lora min-h-screen">
        <div className="flex justify-center items-center mt-[5vh] min-h-screen px-4">
          <div className="w-full max-w-md">
            {showSignupForm && (
              <>
                {mode === "signup" ? (
                  <SignUp forceRedirectUrl="/admin/dashboard" />
                ) : (
                  <SignIn forceRedirectUrl="/admin/dashboard" />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <ConsentModal
        isOpen={showConsentModal}
        onConfirm={handleConsentConfirm}
        onCancel={handleConsentCancel}
      />
    </>
  )
}
