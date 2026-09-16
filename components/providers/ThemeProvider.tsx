'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface ThemeContextType {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize from the class already applied by the blocking inline script in layout.tsx.
  // The blocking script sets html.light-theme when localStorage has 'light'.
  // We read the same class here so our initial state matches what's already painted —
  // this avoids any visual flash.
  const [isDark, setIsDark] = useState<boolean>(true)

  useEffect(() => {
    // Read what the blocking script already applied (or localStorage directly).
    const stored = localStorage.getItem('theme')
    const isCurrentlyLight = stored === 'light'
    setIsDark(!isCurrentlyLight)

    // Ensure body also has the class in case it wasn't available when the head
    // script ran (body is null during <head> parsing).
    if (isCurrentlyLight) {
      document.documentElement.classList.add('light-theme')
      document.body.classList.add('light-theme')
    } else {
      document.documentElement.classList.remove('light-theme')
      document.body.classList.remove('light-theme')
    }
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    const newTheme = newIsDark ? 'dark' : 'light'
    localStorage.setItem('theme', newTheme)
    if (newIsDark) {
      document.documentElement.classList.remove('light-theme')
      document.body.classList.remove('light-theme')
    } else {
      document.documentElement.classList.add('light-theme')
      document.body.classList.add('light-theme')
    }
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
