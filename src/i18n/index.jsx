import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { DEFAULT_LANG } from './constants'
import { en as enDict } from './dictionaries/en'
import { zh as zhDict } from './dictionaries/zh'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem('blaze_lang')
      if (saved === 'en' || saved === 'zh') return saved
    } catch {
      // Ignore unavailable localStorage.
    }
    return navigator.language?.startsWith('zh') ? 'zh' : DEFAULT_LANG
  })

  const setLang = useCallback((newLang) => {
    setLangState(newLang)
    try {
      localStorage.setItem('blaze_lang', newLang)
    } catch {
      // Ignore unavailable localStorage.
    }
  }, [])

  const dictionaries = useMemo(
    () => ({ en: enDict, zh: zhDict }),
    [],
  )

  const t = useCallback(
    (key) => {
      const dict = dictionaries[lang]
      if (!dict) return key
      const parts = key.split('.')
      let value = dict
      for (const k of parts) {
        if (value && typeof value === 'object') {
          value = value[k]
        } else {
          return key
        }
      }
      if (typeof value === 'string') return value
      if (Array.isArray(value)) return value
      return key
    },
    [lang, dictionaries],
  )

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
