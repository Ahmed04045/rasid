'use client'

import { motion } from 'framer-motion'
import { Car, Smartphone } from 'lucide-react'

export type AppMode = 'vehicle' | 'citizen'

const TABS: { id: AppMode; icon: typeof Car; en: string; ar: string }[] = [
  { id: 'vehicle', icon: Car, en: 'Vehicle Autonomous', ar: 'وضع المركبة' },
  { id: 'citizen', icon: Smartphone, en: 'Citizen App', ar: 'وضع المواطن' },
]

export function ModeSwitcher({
  mode,
  onChange,
}: {
  mode: AppMode
  onChange: (mode: AppMode) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="App mode"
      className="grid grid-cols-2 gap-1.5 rounded-2xl border border-border bg-card/60 p-1.5"
    >
      {TABS.map(({ id, icon: Icon, en, ar }) => {
        const active = mode === id
        return (
          <button
            key={id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(id)}
            className={`relative flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              active ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {active && (
              <motion.span
                layoutId="mode-pill"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                className="absolute inset-0 rounded-xl bg-primary"
              />
            )}
            <span className="relative flex items-center gap-2">
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{en}</span>
              <span className="font-mono text-xs opacity-80" dir="rtl">
                {ar}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
