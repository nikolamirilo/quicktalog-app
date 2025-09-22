"use client"
import { disableConsoleInProduction } from "@/helpers/client"
import { createContext, Dispatch, SetStateAction, useContext, useEffect, useState } from "react"

interface MainContextType {
  layout: string
  setLayout: Dispatch<SetStateAction<string>>
  theme?: string
  setTheme?: Dispatch<SetStateAction<string>>
  isLoading: boolean
}

const MainContext = createContext<MainContextType | null>(null)

export const useMainContext = () => {
  return useContext(MainContext)
}

export const MainContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [layout, setLayout] = useState("variant_1")
  const [theme, setTheme] = useState("theme-luxury")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  useEffect(() => {
    disableConsoleInProduction()
  }, [])

  return (
    <MainContext.Provider
      value={{ isLoading, layout, setLayout, theme, setTheme } as MainContextType}>
      {children}
    </MainContext.Provider>
  )
}
