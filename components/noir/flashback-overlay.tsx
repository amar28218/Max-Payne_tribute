"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { sfx } from "@/lib/sfx-manager"
import { onFlashback, FLASHBACK_DURATION_MS } from "@/lib/flashback"

/**
 * Mount once near the root. Fired via triggerFlashback() (lib/flashback) —
 * currently wired to revealing Max's most personal redacted case-file
 * words, so it lands as an emotional beat rather than a random effect.
 */
export function FlashbackOverlay() {
  const [active, setActive] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const unsubscribe = onFlashback(() => {
      sfx.play("flashbackEcho")
      setActive(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setActive(false), FLASHBACK_DURATION_MS)
    })

    return () => {
      unsubscribe()
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9993] pointer-events-none transition-opacity",
        active ? "opacity-100 duration-500" : "opacity-0 duration-700"
      )}
      aria-hidden="true"
    >
      {/* Blue-cool memory tint */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(30, 55, 110, 0.32)", mixBlendMode: "color" }}
      />
      {/* Desaturation + slight fade, sells the "old memory" read */}
      <div
        className="absolute inset-0 transition-[backdrop-filter] duration-500"
        style={{
          backdropFilter: active ? "saturate(0.4) contrast(1.12) brightness(0.85)" : "none",
          WebkitBackdropFilter: active ? "saturate(0.4) contrast(1.12) brightness(0.85)" : "none",
        }}
      />
      {/* VHS scanlines with an occasional tracking stutter, not constant */}
      <div className={cn("absolute inset-0 vhs-scanlines", active && "animate-flashback-glitch")} />
    </div>
  )
}
