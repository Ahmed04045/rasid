'use client'

import { CameraViewport } from '@/components/camera-viewport'
import { Camera, Info, ShieldAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export function CitizenMode({
  onReportSent,
  onSos,
}: {
  onReportSent: () => void
  onSos: () => void
}) {
  const [scanning, setScanning] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  function handleSnap() {
    if (scanning) return
    setScanning(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setScanning(false)
      onReportSent()
    }, 1000)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <CameraViewport
        scanning={scanning}
        scanLabel="ANALYZING PHOTO…"
        statusLabel={scanning ? 'ANALYZING' : 'READY'}
        statusPulse={scanning}
      />

      {/* Side column: citizen actions */}
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <p className="mb-1 text-sm font-semibold">Instant Camera Report</p>
          <p className="mb-4 text-xs leading-relaxed text-muted-foreground text-pretty">
            Point your camera at any road hazard or incident and let Rased AI analyze and route it
            to the right authority.
          </p>
          <button
            type="button"
            onClick={handleSnap}
            disabled={scanning}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 text-base font-bold text-primary-foreground shadow-lg transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Camera className="h-5 w-5" aria-hidden="true" />
            {scanning ? 'Analyzing…' : 'Snap & Analyze'}
            <span className="font-mono" dir="rtl">
              تصوير لحظي
            </span>
          </button>
        </div>

        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-destructive">
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            Emergency SOS
          </p>
          <p className="mb-4 text-xs leading-relaxed text-muted-foreground text-pretty">
            Life-threatening emergency? Send a high-priority alert with your live location in one
            tap.
          </p>
          <button
            type="button"
            onClick={onSos}
            className="sos-glow inline-flex w-full items-center justify-center gap-2 rounded-xl bg-destructive px-5 py-4 text-base font-bold text-destructive-foreground transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
            SOS Emergency
            <span className="font-mono" dir="rtl">
              طوارئ
            </span>
          </button>
        </div>

        <p className="flex items-start gap-2 rounded-lg border border-border bg-card/40 p-3 text-[11px] leading-relaxed text-muted-foreground text-pretty">
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" aria-hidden="true" />
          Reports are anonymized and forwarded to municipal, traffic, and emergency services based
          on AI severity classification.
        </p>
      </div>
    </div>
  )
}
