"use client"

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [autoMood, setAutoMood] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('auto_mood')
      if (saved === null) return false
      return saved === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    localStorage.setItem('auto_mood', String(autoMood))
    // notify other tabs/components
    try {
      window.dispatchEvent(new CustomEvent('auto-mood-changed', { detail: { value: autoMood } }))
    } catch {}
  }, [autoMood])

  if (!mounted) return null

  const currentTheme = theme === 'system' ? systemTheme : theme

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Switch
          checked={autoMood}
          onCheckedChange={setAutoMood}
          aria-label="Auto Mood"
        />
        <span className="text-sm text-muted-foreground">Auto Mood</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle theme"
        onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
      >
        {currentTheme === 'dark' ? <Sun className="h-4 w-4 text-foreground" /> : <Moon className="h-4 w-4 text-foreground" />}
      </Button>
    </div>
  )
}
