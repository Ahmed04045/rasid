'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Send, ShieldAlert, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const CHIPS = [
  { icon: '🔥', en: 'Fire', ar: 'حريق' },
  { icon: '💥', en: 'Accident', ar: 'حادث' },
  { icon: '⚠️', en: 'Kidnapping', ar: 'خطف' },
  { icon: '🚑', en: 'Medical', ar: 'حالة طبية' },
]

export function SosModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit: () => void
}) {
  const [value, setValue] = useState('')

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  function handleSend() {
    if (!value.trim()) return
    setValue('')
    onSubmit()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sos-title"
        >
          <button
            type="button"
            aria-label="Close emergency dialog"
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-destructive/40 bg-card shadow-2xl"
          >
            {/* red glow header */}
            <div className="flex items-center gap-3 border-b border-border bg-destructive/10 px-5 py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/20 ring-1 ring-destructive/40">
                <ShieldAlert className="h-5 w-5 text-destructive" aria-hidden="true" />
              </span>
              <div className="leading-tight">
                <h2 id="sos-title" className="font-mono text-base font-bold text-destructive">
                  طوارئ عاجلة
                </h2>
                <p className="text-sm font-semibold">Emergency Alert</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="ml-auto rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <label htmlFor="sos-input" className="block text-sm text-muted-foreground text-pretty">
                <span className="font-mono">صف المشكلة في كلمتين (مثال: حريق، حادث، خطف...)</span>
                <br />
                Describe the emergency in a few words
              </label>

              {/* quick-select chips */}
              <div className="flex flex-wrap gap-2">
                {CHIPS.map((c) => {
                  const label = `${c.icon} ${c.ar} / ${c.en}`
                  const active = value === label
                  return (
                    <button
                      key={c.en}
                      type="button"
                      onClick={() => setValue(label)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                        active
                          ? 'border-destructive bg-destructive/15 text-destructive'
                          : 'border-border bg-secondary/50 text-foreground hover:border-destructive/50'
                      }`}
                    >
                      {c.icon} {c.ar} <span className="text-muted-foreground">/ {c.en}</span>
                    </button>
                  )
                })}
              </div>

              <input
                id="sos-input"
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) {
                    handleSend()
                  }
                }}
                placeholder="e.g. Fire on the 3rd floor…"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-destructive focus:ring-2 focus:ring-destructive/30"
              />

              <button
                type="button"
                onClick={handleSend}
                disabled={!value.trim()}
                className="sos-glow inline-flex w-full items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-3 text-sm font-bold text-destructive-foreground transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                إرسال البلاغ / Send Report
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
