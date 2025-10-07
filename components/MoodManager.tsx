"use client"

import { useEffect } from 'react'

export function MoodManager() {
  useEffect(() => {
    const apply = () => {
      const saved = localStorage.getItem('auto_mood')
      const auto = saved === null ? true : saved === 'true'
      const mood = localStorage.getItem('current_mood') as 'ok' | 'watch' | 'overspend' | null
      const root = document.documentElement
      if (auto && mood) root.setAttribute('data-mood', mood)
      else root.removeAttribute('data-mood')
    }

    apply()

    const onCustom = () => apply()
    window.addEventListener('auto-mood-changed', onCustom as EventListener)
    window.addEventListener('storage', onCustom)

    return () => {
      window.removeEventListener('auto-mood-changed', onCustom as EventListener)
      window.removeEventListener('storage', onCustom)
    }
  }, [])

  return null
}

