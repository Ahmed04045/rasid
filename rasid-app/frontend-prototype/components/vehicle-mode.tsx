'use client'

import { CameraViewport } from '@/components/camera-viewport'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Activity, CheckCircle2, MapPin, Radio, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

type Severity = 'Clear' | 'Medium' | 'High' | 'Critical'

type DetectionState = {
  label: string
  labelAr: string
  severity: Severity
  confidence: number
  action: string
}

const CYCLE: DetectionState[] = [
  {
    label: 'Clear Road',
    labelAr: 'الطريق سالكة',
    severity: 'Clear',
    confidence: 99,
    action: 'No hazards detected. Continuing autonomous monitoring.',
  },
  {
    label: 'Pothole Detected',
    labelAr: 'حفرة في الطريق',
    severity: 'High',
    confidence: 94,
    action: 'Maintenance work order auto-dispatched to municipality crew.',
  },
  {
    label: 'Clear Road',
    labelAr: 'الطريق سالكة',
    severity: 'Clear',
    confidence: 98,
    action: 'No hazards detected. Continuing autonomous monitoring.',
  },
  {
    label: 'Collision Hazard',
    labelAr: 'خطر تصادم',
    severity: 'Critical',
    confidence: 97,
    action: 'Emergency response & ambulance auto-placed on standby.',
  },
  {
    label: 'Road Obstacle',
    labelAr: 'عائق على الطريق',
    severity: 'Medium',
    confidence: 90,
    action: 'Traffic control auto-notified to deploy warning signage.',
  },
]

const severityStyles: Record<Severity, string> = {
  Clear: 'bg-success/15 text-success ring-success/30',
  Critical: 'bg-destructive/15 text-destructive ring-destructive/30',
  High: 'bg-warning/15 text-warning ring-warning/30',
  Medium: 'bg-primary/15 text-primary ring-primary/30',
}

const STATS = [
  { icon: Radio, value: '24/7', label: 'Autonomous monitoring' },
  { icon: Activity, value: '5s', label: 'Detection interval' },
  { icon: ShieldCheck, value: '38', label: 'Authorities linked' },
]

export function VehicleMode() {
  const [index, setIndex] = useState(0)

  // Automated detection loop — updates itself every 5s with zero user interaction
  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % CYCLE.length)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const current = CYCLE[index]
  const isClear = current.severity === 'Clear'

  return (
    <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <CameraViewport statusLabel="AI SCANNING" statusPulse>
        {/* Autonomous badge */}
        <div className="pointer-events-none absolute left-1/2 top-16 -translate-x-1/2">
          <span className="rounded-full border border-primary/30 bg-background/60 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-primary backdrop-blur-sm">
            Autonomous black-box · no driver input
          </span>
        </div>

        {/* Live detection banner over feed */}
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="pointer-events-none absolute inset-x-4 top-1/2 mt-8 flex justify-center"
          >
            <span
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-xs font-bold ring-1 backdrop-blur-sm ${severityStyles[current.severity]}`}
            >
              {isClear ? (
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              ) : (
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              )}
              {current.label} · {current.confidence}%
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
              key={index}
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
                    <p className="font-semibold leading-tight">{current.label}</p>
                    <p className="font-mono text-xs text-muted-foreground" dir="rtl">
                      {current.labelAr}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${severityStyles[current.severity]}`}
                >
                  {current.severity}
                </span>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>AI Confidence</span>
                  <span className="font-mono text-foreground">{current.confidence}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${current.confidence}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`h-full rounded-full ${isClear ? 'bg-success' : 'bg-primary'}`}
                  />
                </div>
              </div>

              <div
                className={`rounded-lg border p-3 ${
                  isClear
                    ? 'border-success/25 bg-success/10'
                    : 'border-warning/25 bg-warning/10'
                }`}
              >
                <p className="text-xs leading-relaxed text-pretty">
                  <span
                    className={`font-semibold ${isClear ? 'text-success' : 'text-warning'}`}
                  >
                    {isClear ? 'Status: ' : 'Action taken: '}
                  </span>
                  {current.action}
                </p>
              </div>

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
