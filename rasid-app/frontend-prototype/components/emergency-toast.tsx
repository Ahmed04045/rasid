'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

export type ToastVariant = 'report' | 'sos'

const MESSAGES: Record<ToastVariant, { ar: string; en: string; accent: string }> = {
  report: {
    ar: 'تم إرسال البلاغ للجهات المعنية بنجاح وسيتم التعامل فوراً',
    en: 'Report sent to concerned authorities successfully.',
    accent: 'success',
  },
  sos: {
    ar: 'تم إرسال طلبك للجهات المعنية بنجاح وسيتم التعامل فوراً',
    en: 'Your request has been sent to the concerned authorities successfully.',
    accent: 'destructive',
  },
}

export function EmergencyToast({
  show,
  variant = 'sos',
}: {
  show: boolean
  variant?: ToastVariant
}) {
  const msg = MESSAGES[variant]
  const isSos = variant === 'sos'

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 24, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 24, x: '-50%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className="fixed bottom-6 left-1/2 z-[60] w-[min(92vw,26rem)]"
          role="status"
          aria-live="polite"
        >
          <div
            className={`overflow-hidden rounded-xl border bg-card shadow-2xl ring-1 ${
              isSos
                ? 'border-destructive/40 ring-destructive/20'
                : 'border-success/40 ring-success/20'
            }`}
          >
            <div className="flex items-start gap-3 p-4">
              <span
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ring-1 ${
                  isSos ? 'bg-destructive/15 ring-destructive/40' : 'bg-success/15 ring-success/40'
                }`}
              >
                <CheckCircle2
                  className={`h-6 w-6 ${isSos ? 'text-destructive' : 'text-success'}`}
                  aria-hidden="true"
                />
              </span>
              <div className="min-w-0 leading-relaxed">
                <p
                  className={`font-mono text-sm font-semibold text-pretty ${
                    isSos ? 'text-destructive' : 'text-success'
                  }`}
                  dir="rtl"
                >
                  {msg.ar}
                </p>
                <p className="mt-1 text-sm text-muted-foreground text-pretty">{msg.en}</p>
              </div>
            </div>
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: 0 }}
              transition={{ duration: 5, ease: 'linear' }}
              className={`h-1 ${isSos ? 'bg-destructive' : 'bg-success'}`}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
