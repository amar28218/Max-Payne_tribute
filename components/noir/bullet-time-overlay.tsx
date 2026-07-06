"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { sfx } from "@/lib/sfx-manager"
import {
  onBulletTime,
  BULLET_TIME_ONSET_MS,
  BULLET_TIME_HOLD_MS,
  BULLET_TIME_TOTAL_MS,
} from "@/lib/bullet-time"

type Phase = "idle" | "onset" | "hold" | "exit"

interface Casing {
  id: number
  startX: number
  rotation: number
  delay: number
  drift: number
}

function generateCasings(count: number): Casing[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    startX: 8 + Math.random() * 84,
    rotation: 120 + Math.random() * 360,
    delay: Math.random() * 350,
    drift: (Math.random() - 0.5) * 70,
  }))
}

/**
 * Mount once near the root. Any component anywhere can call
 * triggerBulletTime() (from lib/bullet-time) to fire this — used sparingly,
 * at 2-3 genuine narrative moments rather than as a generic hover effect.
 */
export function BulletTimeOverlay() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [casings, setCasings] = useState<Casing[]>([])
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }, [])

  useEffect(() => {
    const unsubscribe = onBulletTime(() => {
      clearTimers()
      setCasings(generateCasings(7))
      sfx.play("heartbeat")
      setPhase("onset")

      timeoutsRef.current.push(
        setTimeout(() => setPhase("hold"), BULLET_TIME_ONSET_MS),
        setTimeout(() => setPhase("exit"), BULLET_TIME_ONSET_MS + BULLET_TIME_HOLD_MS),
        setTimeout(() => setPhase("idle"), BULLET_TIME_TOTAL_MS)
      )
    })

    return () => {
      unsubscribe()
      clearTimers()
    }
  }, [clearTimers])

  if (phase === "idle") return null

  return (
    <div className="fixed inset-0 z-[9994] pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Cool desaturated tint + vignette */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity",
          phase === "onset" && "duration-100 opacity-70",
          phase === "hold" && "duration-300 opacity-100",
          phase === "exit" && "duration-500 opacity-0"
        )}
        style={{
          backdropFilter: "saturate(0.5) brightness(0.9) contrast(1.1)",
          WebkitBackdropFilter: "saturate(0.5) brightness(0.9) contrast(1.1)",
          background: "radial-gradient(ellipse at center, transparent 38%, rgba(8,12,30,0.6) 100%)",
        }}
      />

      {/* Onset stutter — reality skips before the slow-mo settles in */}
      {phase === "onset" && (
        <div className="absolute inset-0 bg-white/10 animate-[bullet-time-stutter_150ms_ease-out]" />
      )}

      {/* Shell casings, falling in slow motion for the length of the hold + exit */}
      {(phase === "hold" || phase === "exit") &&
        casings.map((c) => (
          <div
            key={c.id}
            className="absolute -top-10 animate-shell-fall"
            style={{
              left: `${c.startX}%`,
              animationDelay: `${c.delay}ms`,
              animationDuration: `${BULLET_TIME_HOLD_MS + 450}ms`,
              ["--shell-rotation" as string]: `${c.rotation}deg`,
              ["--shell-drift" as string]: `${c.drift}px`,
            }}
          >
            <div className="w-1.5 h-4 rounded-[1px] bg-gradient-to-b from-[#c9a24b] to-[#7a6220] shadow-[0_0_4px_rgba(0,0,0,0.6)]" />
          </div>
        ))}

      {/* Time-dilation gauge — a nod to the genre's HUD conventions, generic/original styling */}
      <div
        className={cn(
          "absolute bottom-10 left-1/2 -translate-x-1/2 w-52 transition-opacity duration-300",
          phase === "hold" ? "opacity-90" : "opacity-0"
        )}
      >
        <p className="font-mono text-[10px] tracking-[0.35em] text-primary/90 uppercase mb-1 text-center">
          Time
        </p>
        <div className="h-[3px] w-full bg-white/10 overflow-hidden">
          {phase === "hold" && (
            <div
              className="h-full bg-primary"
              style={{ animation: `bullet-time-gauge ${BULLET_TIME_HOLD_MS}ms linear forwards` }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
