import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { getLanguage, setLanguage, t, type Language } from '../utils/i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getLanguage())
  const [updateKey, setUpdateKey] = useState(0)

  useEffect(() => {
    // Sync with i18n utility
    setLanguage(language)
    // Force re-render by updating key
    setUpdateKey((prev) => prev + 1)
  }, [language])

  const handleSetLanguage = (lang: Language) => {
    setLanguageState(lang)
    setLanguage(lang)
  }

  return (
    <LanguageContext.Provider
      key={updateKey}
      value={{
        language,
        setLanguage: handleSetLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
