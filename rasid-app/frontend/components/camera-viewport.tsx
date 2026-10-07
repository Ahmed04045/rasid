'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CameraOff, Crosshair, Radio, ScanLine } from 'lucide-react'
import type { ReactNode } from 'react'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

type CamState = 'loading' | 'live' | 'denied'

export type CameraViewportHandle = {
  /** Captures the current video frame as a JPEG Blob, or null if the camera isn't live yet. */
  captureFrame: () => Promise<Blob | null>
  isLive: () => boolean
}

type CameraViewportProps = {
  scanning?: boolean
  scanLabel?: string
  statusLabel?: string
  statusPulse?: boolean
  children?: ReactNode
}

export const CameraViewport = forwardRef<CameraViewportHandle, CameraViewportProps>(
  function CameraViewport(
    {
      scanning = false,
      scanLabel = 'ANALYZING FRAME…',
      statusLabel = 'AI SCANNING',
      statusPulse = false,
      children,
    },
    ref,
  ) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const [camState, setCamState] = useState<CamState>('loading')
    const [clock, setClock] = useState('')
    const [speed, setSpeed] = useState(64)

    // Start webcam
    useEffect(() => {
      let stream: MediaStream | null = null
      async function start() {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false,
          })
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            setCamState('live')
          }
        } catch {
          setCamState('denied')
        }
      }
      start()
      return () => {
        stream?.getTracks().forEach((t) => t.stop())
      }
    }, [])

    // Live HUD clock + jittering speed to feel real-time
    useEffect(() => {
      const id = setInterval(() => {
        setClock(new Date().toLocaleTimeString('en-GB'))
        setSpeed((s) => Math.max(0, Math.min(120, s + Math.round((Math.random() - 0.5) * 6))))
      }, 1000)
      return () => clearInterval(id)
    }, [])

    // Exposes real frame capture to parent components (VehicleMode, CitizenMode)
    useImperativeHandle(ref, () => ({
      isLive: () => camState === 'live',
      captureFrame: () =>
        new Promise((resolve) => {
          const video = videoRef.current
          if (!video || camState !== 'live' || video.videoWidth === 0) {
            resolve(null)
            return
          }
          if (!canvasRef.current) {
            canvasRef.current = document.createElement('canvas')
          }
          const canvas = canvasRef.current
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(null)
            return
          }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85)
        }),
    }))

    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black shadow-2xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
          aria-label="Live camera feed"
        />

        {/* Loading / denied fallback */}
        {camState !== 'live' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card text-center">
            {camState === 'loading' ? (
              <>
                <Radio className="h-8 w-8 animate-pulse text-primary" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">Connecting to camera…</p>
              </>
            ) : (
              <>
                <CameraOff className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                <p className="max-w-xs text-sm text-muted-foreground text-pretty">
                  Camera unavailable. Enable camera permissions to view the live feed and send
                  reports.
                </p>
              </>
            )}
          </div>
        )}

        {/* HUD overlay */}
        <div className="pointer-events-none absolute inset-0">
          {/* corner frames */}
          <div className="absolute left-3 top-3 h-6 w-6 border-l-2 border-t-2 border-primary/70" />
          <div className="absolute right-3 top-3 h-6 w-6 border-r-2 border-t-2 border-primary/70" />
          <div className="absolute bottom-3 left-3 h-6 w-6 border-b-2 border-l-2 border-primary/70" />
          <div className="absolute bottom-3 right-3 h-6 w-6 border-b-2 border-r-2 border-primary/70" />

          {/* top HUD row */}
          <div className="absolute inset-x-4 top-4 flex items-center justify-between font-mono text-[11px] text-primary">
            <span className="flex items-center gap-1.5 rounded bg-background/50 px-2 py-1 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
              REC {clock}
            </span>
            <span className="flex items-center gap-1.5 rounded bg-background/50 px-2 py-1 backdrop-blur-sm">
              <ScanLine
                className={`h-3 w-3 ${statusPulse ? 'animate-pulse' : ''}`}
                aria-hidden="true"
              />
              {statusLabel}
            </span>
          </div>

          {/* center reticle */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Crosshair className="h-10 w-10 text-primary/40" aria-hidden="true" />
          </div>

          {/* bottom HUD row */}
          <div className="absolute inset-x-4 bottom-4 flex items-end justify-between font-mono text-[11px] text-primary/90">
            <span className="rounded bg-background/50 px-2 py-1 backdrop-blur-sm">
              24.7136° N · 46.6753° E
            </span>
            <span className="rounded bg-background/50 px-2 py-1 text-right backdrop-blur-sm">
              <span className="text-lg font-bold leading-none text-primary">{speed}</span>{' '}
              <span className="text-primary/70">km/h</span>
            </span>
          </div>
        </div>

        {/* Custom overlays (badges, detection labels) */}
        {children}

        {/* Scanning sweep */}
        <AnimatePresence>
          {scanning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <div className="absolute inset-0 bg-primary/10" />
              <motion.div
                initial={{ top: '0%' }}
                animate={{ top: '100%' }}
                transition={{ duration: 1, ease: 'linear', repeat: Infinity }}
                className="absolute inset-x-0 h-16 -translate-y-1/2"
                style={{
                  background:
                    'linear-gradient(to bottom, transparent, color-mix(in oklch, var(--color-primary) 60%, transparent), transparent)',
                }}
              />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-sm font-bold tracking-widest text-primary">
                {scanLabel}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  },
)