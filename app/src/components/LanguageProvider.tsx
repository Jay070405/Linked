"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"

export type SiteLanguage = "en" | "zh"

interface LanguageContextValue {
  language: SiteLanguage
  setLanguage: (language: SiteLanguage) => void
  toggleLanguage: () => void
}

const STORAGE_KEY = "portfolio-language"

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<SiteLanguage>("en")

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === "en" || stored === "zh") {
      setLanguageState(stored)
    }
  }, [])

  const setLanguage = (nextLanguage: SiteLanguage) => {
    setLanguageState(nextLanguage)
    window.localStorage.setItem(STORAGE_KEY, nextLanguage)
  }

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "zh" : "en")
  }

  const value = {
    language,
    setLanguage,
    toggleLanguage,
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }

  return context
}
