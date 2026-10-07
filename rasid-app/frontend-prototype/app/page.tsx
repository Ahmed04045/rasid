'use client'

import { CitizenMode } from '@/components/citizen-mode'
import { EmergencyToast, type ToastVariant } from '@/components/emergency-toast'
import { ModeSwitcher, type AppMode } from '@/components/mode-switcher'
import { SosModal } from '@/components/sos-modal'
import { TopBar } from '@/components/top-bar'
import { VehicleMode } from '@/components/vehicle-mode'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

export default function Page() {
  const [mode, setMode] = useState<AppMode>('vehicle')
  const [sosOpen, setSosOpen] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; variant: ToastVariant }>({
    show: false,
    variant: 'sos',
  })
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  function fireToast(variant: ToastVariant) {
    setToast({ show: true, variant })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 5000)
  }

  function handleSosSubmit() {
    setSosOpen(false)
    fireToast('sos')
  }

  const statusLabel = mode === 'vehicle' ? 'LIVE VEHICLE CAM ACTIVE' : 'CITIZEN PORTAL ONLINE'

  return (
    <div className="min-h-dvh bg-background">
      {/* Ambient glow backdrop */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-70"
        style={{
          background:
            'radial-gradient(55% 40% at 50% 0%, color-mix(in oklch, var(--color-primary) 12%, transparent), transparent 70%)',
        }}
        aria-hidden="true"
      />

      <TopBar statusLabel={statusLabel} />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        <div className="mb-5">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {mode === 'vehicle'
              ? 'Autonomous Vehicle Monitoring'
              : 'Citizen Reporting Portal'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">
            {mode === 'vehicle'
              ? 'A 24/7 AI dashcam that detects road hazards and routes them automatically — no driver input needed.'
              : 'Snap a report or trigger an emergency SOS. Rased AI routes it to the right authority instantly.'}
          </p>
        </div>

        <div className="mb-6">
          <ModeSwitcher mode={mode} onChange={setMode} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            {mode === 'vehicle' ? (
              <VehicleMode />
            ) : (
              <CitizenMode
                onReportSent={() => fireToast('report')}
                onSos={() => setSosOpen(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <SosModal open={sosOpen} onClose={() => setSosOpen(false)} onSubmit={handleSosSubmit} />
      <EmergencyToast show={toast.show} variant={toast.variant} />
    </div>
  )
}
