"use client"

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

// A lightweight top progress indicator that animates on route changes
export function RouteLoader() {
  const pathname = usePathname()
  const [active, setActive] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Trigger the loader on any pathname change
    setActive(true)

    // Simulate quick progression and hide shortly after
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setActive(false), 500)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [pathname])

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        zIndex: 50,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          height: '100%',
          width: active ? '100%' : '0%',
          background: 'linear-gradient(90deg, #6366f1, #22d3ee)',
          transition: 'width 300ms ease',
          boxShadow: '0 0 8px rgba(99,102,241,0.6)',
        }}
      />
    </div>
  )
}

