"use client"
import { useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

export function useNavigationBlock(shouldBlock: boolean, onNavigationAttempt: () => void) {
  const router = useRouter()
  const currentPath = useRef<string>("")

  useEffect(() => {
    // Store current path
    currentPath.current = window.location.pathname + window.location.search

    // Handle beforeunload (refresh, close tab, etc.)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!shouldBlock) return
      e.preventDefault()
      e.returnValue = ""
    }

    // Handle popstate (back/forward buttons)
    const handlePopState = (e: PopStateEvent) => {
      if (!shouldBlock) return

      // Prevent navigation by pushing current state back
      window.history.pushState(null, "", currentPath.current)
      onNavigationAttempt()
    }

    // Handle programmatic navigation (Next.js router)
    const originalPush = router.push
    const originalReplace = router.replace
    const originalBack = router.back
    const originalForward = router.forward

    if (shouldBlock) {
      router.push = (...args) => {
        onNavigationAttempt()
        return Promise.resolve(true)
      }
      router.replace = (...args) => {
        onNavigationAttempt()
        return Promise.resolve(true)
      }
      router.back = () => {
        onNavigationAttempt()
      }
      router.forward = () => {
        onNavigationAttempt()
      }

      // Push initial state to enable popstate detection
      window.history.pushState(null, "", currentPath.current)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("popstate", handlePopState)

    return () => {
      // Cleanup
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("popstate", handlePopState)

      // Restore original router methods
      router.push = originalPush
      router.replace = originalReplace
      router.back = originalBack
      router.forward = originalForward
    }
  }, [shouldBlock, router, onNavigationAttempt])
}
