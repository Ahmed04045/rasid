'use client'

import { Radio } from 'lucide-react'

export function TopBar({ statusLabel }: { statusLabel: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        {/* Logo + name */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
            <Radio className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold tracking-tight sm:text-base">
              Rased <span className="font-mono text-primary">راصد</span>
            </p>
            <p className="truncate text-[11px] text-muted-foreground">Smart City Safety</p>
          </div>
        </div>

        {/* Live status */}
        <div className="ml-auto inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
          </span>
          <span className="text-[11px] font-medium text-success sm:text-xs">{statusLabel}</span>
        </div>
      </div>
    </header>
  )
}
