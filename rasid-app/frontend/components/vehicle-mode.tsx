'use client'

import { CameraViewport, type CameraViewportHandle } from '@/components/camera-viewport'
import { analyzeFrame, type AnalysisResult } from '@/lib/api'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Activity, CheckCircle2, MapPin, Radio, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const severityStyles: Record<AnalysisResult['severity_level'], string> = {
  LOW: 'bg-success/15 text-success ring-success/30',
  MEDIUM: 'bg-primary/15 text-primary ring-primary/30',
  HIGH: 'bg-warning/15 text-warning ring-warning/30',
  CRITICAL: 'bg-destructive/15 text-destructive ring-destructive/30',
}

const STATS = [
  { icon: Radio, value: '24/7', label: 'Autonomous monitoring' },
  { icon: Activity, value: '5s', label: 'Detection interval' },
  { icon: ShieldCheck, value: '38', label: 'Authorities linked' },
]

const IDLE_RESULT: AnalysisResult = {
  category: 'GENERAL_INQUIRY',
  severity_level: 'LOW',
  target_entity: 'MUNICIPALITY',
  summary: 'Waiting for the first camera frame…',
  action_required: 'No hazards detected yet. Monitoring continues automatically.',
}

export function VehicleMode() {
  const camRef = useRef<CameraViewportHandle>(null)
  const inFlight = useRef(false)
  const [result, setResult] = useState<AnalysisResult>(IDLE_RESULT)
  const [tick, setTick] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Automated detection loop - captures a real frame and sends it to the
  // Rasid backend every 5s, with zero user interaction.
  useEffect(() => {
    const id = setInterval(async () => {
      if (inFlight.current) return
      const blob = await camRef.current?.captureFrame()
      if (!blob) return

      inFlight.current = true
      try {
        const analysis = await analyzeFrame(blob, 'vehicle_01')
        setResult(analysis)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not reach the Rasid server.')
      } finally {
        inFlight.current = false
        setTick((t) => t + 1)
      }
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const isClear = result.severity_level === 'LOW'

  return (
    <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <CameraViewport ref={camRef} statusLabel="AI SCANNING" statusPulse>
        {/* Autonomous badge */}
        <div className="pointer-events-none absolute left-1/2 top-16 -translate-x-1/2">
          <span className="rounded-full border border-primary/30 bg-background/60 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-primary backdrop-blur-sm">
            Autonomous black-box · no driver input
          </span>
        </div>

        {/* Live detection banner over feed */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tick}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="pointer-events-none absolute inset-x-4 top-1/2 mt-8 flex justify-center"
          >
            <span
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-xs font-bold ring-1 backdrop-blur-sm ${severityStyles[result.severity_level]}`}
            >
              {isClear ? (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              )}
              {result.category.replace(/_/g, ' ')}
            </span>
          </motion.div>
        </AnimatePresence>
      </CameraViewport>

      {/* Side column: continuously updating detection + stats */}
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border bg-card/60 p-4">
          <p className="mb-3 flex items-center justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Live Detection
            </span>
            <span className="font-mono text-[10px] normal-case text-primary">auto · 5s</span>
          </p>

          <AnimatePresence mode="wait">
            <motion.div
              key={tick}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35 }}
              className="space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isClear ? (
                    <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-warning" aria-hidden="true" />
                  )}
                  <div>
                    <p className="font-semibold leading-tight">
                      {result.category.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      → {result.target_entity.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${severityStyles[result.severity_level]}`}
                >
                  {result.severity_level}
                </span>
              </div>

              <div
                className={`rounded-lg border p-3 ${
                  isClear ? 'border-success/25 bg-success/10' : 'border-warning/25 bg-warning/10'
                }`}
              >
                <p className="text-xs leading-relaxed text-pretty">
                  <span className={`font-semibold ${isClear ? 'text-success' : 'text-warning'}`}>
                    {isClear ? 'Status: ' : 'Action taken: '}
                  </span>
                  {result.action_required}
                </p>
              </div>

              {error && (
                <p className="text-[11px] text-destructive">Connection issue: {error}</p>
              )}

              <p className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                King Fahd Rd · 24.7136° N, 46.6753° E
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {STATS.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="rounded-xl border border-border bg-card/60 p-3 text-center"
            >
              <Icon className="mx-auto mb-1.5 h-4 w-4 text-primary" aria-hidden="true" />
              <div className="text-base font-semibold">{value}</div>
              <div className="text-[10px] leading-tight text-muted-foreground text-pretty">
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}