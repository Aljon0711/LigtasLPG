import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { supabase } from './supabase'
import {
  applyDarkClass,
  LANG_EN,
  LANG_PH,
  readStoredPrefs,
  translate,
  writeStoredPrefs,
} from './i18n'

const PreferencesContext = createContext(null)

export function PreferencesProvider({ children }) {
  const stored = readStoredPrefs()
  const [darkMode, setDarkModeState] = useState(stored.darkMode)
  const [language, setLanguageState] = useState(stored.language)
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    applyDarkClass(darkMode)
    writeStoredPrefs({ darkMode, language })
  }, [darkMode, language])

  // Load prefs from profile when session exists; keep localStorage for guests
  useEffect(() => {
    let cancelled = false

    async function syncFromSession(session) {
      const id = session?.user?.id || null
      if (cancelled) return
      setUserId(id)

      if (!id) return

      const { data } = await supabase
        .from('profiles')
        .select('dark_mode, language')
        .eq('id', id)
        .maybeSingle()

      if (cancelled || !data) return

      setDarkModeState(Boolean(data.dark_mode))
      setLanguageState(data.language === LANG_PH ? LANG_PH : LANG_EN)
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      syncFromSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncFromSession(session)
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const setDarkMode = useCallback(
    async (next) => {
      const value = Boolean(next)
      setDarkModeState(value)
      applyDarkClass(value)
      writeStoredPrefs({ darkMode: value, language })

      if (userId) {
        const { error } = await supabase
          .from('profiles')
          .update({ dark_mode: value, updated_at: new Date().toISOString() })
          .eq('id', userId)
        return { error }
      }
      return { error: null }
    },
    [userId, language]
  )

  const setLanguage = useCallback(
    async (next) => {
      const value = next === LANG_PH ? LANG_PH : LANG_EN
      setLanguageState(value)
      writeStoredPrefs({ darkMode, language: value })

      if (userId) {
        const { error } = await supabase
          .from('profiles')
          .update({ language: value, updated_at: new Date().toISOString() })
          .eq('id', userId)
        return { error }
      }
      return { error: null }
    },
    [userId, darkMode]
  )

  const t = useCallback(
    (key, vars) => translate(language, key, vars),
    [language]
  )

  const value = useMemo(
    () => ({
      darkMode,
      language,
      setDarkMode,
      setLanguage,
      t,
    }),
    [darkMode, language, setDarkMode, setLanguage, t]
  )

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) {
    throw new Error('usePreferences must be used within PreferencesProvider')
  }
  return ctx
}
