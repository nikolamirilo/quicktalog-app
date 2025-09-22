import { MainContextProvider } from "@/context/MainContext"
import { ClerkProvider } from "@clerk/nextjs"
import CookieBanner from "../common/CookieBanner"

export const PageWrapperClient = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <ClerkProvider afterSignOutUrl="/" signInUrl="/auth" signUpUrl="/auth?mode=signup">
      <MainContextProvider>{children}</MainContextProvider>
      <CookieBanner />
    </ClerkProvider>
  )
}
