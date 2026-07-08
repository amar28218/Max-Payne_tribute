"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

export type TransitionType = "iris" | "blinds" | "smash" | "burn"

interface CinematicTransitionProps {
  type: TransitionType
  isActive: boolean
  onComplete: () => void
}

export function CinematicTransition({ type, isActive, onComplete }: CinematicTransitionProps) {
  const [phase, setPhase] = useState<"idle" | "in" | "out">("idle")
  const audioContextRef = useRef<AudioContext | null>(null)

  // Play snap sound for smash cut
  const playSnapSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      const ctx = audioContextRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      
      oscillator.frequency.setValueAtTime(150, ctx.currentTime)
      oscillator.type = "square"
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05)
      
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.05)
    } catch {
      // Audio not available
    }
  }, [])

  useEffect(() => {
    if (isActive) {
      setPhase("in")
      
      const inDuration = type === "smash" ? 50 : type === "blinds" ? 400 : 500
      const outDuration = type === "smash" ? 100 : type === "blinds" ? 400 : 500
      
      if (type === "smash") {
        playSnapSound()
      }

      const midTimer = setTimeout(() => {
        onComplete()
        setPhase("out")
      }, inDuration)

      const endTimer = setTimeout(() => {
        setPhase("idle")
      }, inDuration + outDuration)

      return () => {
        clearTimeout(midTimer)
        clearTimeout(endTimer)
      }
    }
  }, [isActive, type, onComplete, playSnapSound])

  if (phase === "idle") return null

  return (
    <>
      {/* Letterbox bars */}
      <div className="fixed inset-x-0 top-0 z-[9990] pointer-events-none">
        <div 
          className={cn(
            "w-full bg-black transition-all duration-300",
            phase === "in" ? "h-16" : "h-0"
          )}
        />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-[9990] pointer-events-none">
        <div 
          className={cn(
            "w-full bg-black transition-all duration-300",
            phase === "in" ? "h-16" : "h-0"
          )}
        />
      </div>

      {/* Intensified grain during transition — always visible here, since the component returns null entirely when idle */}
      <div 
        className="fixed inset-0 pointer-events-none z-[9991] opacity-100 transition-opacity duration-200"
        style={{
          background: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
          opacity: 0.08,
        }}
      />

      {/* Iris wipe */}
      {type === "iris" && (
        <div className="fixed inset-0 z-[9992] pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <defs>
              <clipPath id="iris-clip">
                <circle
                  cx="50"
                  cy="50"
                  r={phase === "in" ? 0 : phase === "out" ? 100 : 100}
                  style={{
                    transition: "r 500ms ease-in-out",
                  }}
                />
              </clipPath>
            </defs>
            <rect
              x="0"
              y="0"
              width="100"
              height="100"
              fill="black"
              clipPath="url(#iris-clip)"
              style={{
                clipPath: phase === "in" 
                  ? "circle(0% at 50% 50%)" 
                  : "circle(150% at 50% 50%)",
                transition: "clip-path 500ms ease-in-out",
              }}
            />
          </svg>
          <div 
            className="absolute inset-0 bg-black"
            style={{
              clipPath: phase === "out" 
                ? "circle(0% at 50% 50%)" 
                : "circle(150% at 50% 50%)",
              transition: "clip-path 500ms ease-in-out",
            }}
          />
        </div>
      )}

      {/* Venetian blinds */}
      {type === "blinds" && (
        <div className="fixed inset-0 z-[9992] pointer-events-none flex flex-col">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-black origin-top"
              style={{
                transform: phase === "in" 
                  ? "rotateX(0deg)" 
                  : "rotateX(90deg)",
                transition: `transform 400ms ease-in-out`,
                transitionDelay: phase === "in" 
                  ? `${i * 25}ms` 
                  : `${(11 - i) * 25}ms`,
              }}
            />
          ))}
        </div>
      )}

      {/* Smash cut - white flash */}
      {type === "smash" && (
        <div 
          className={cn(
            "fixed inset-0 z-[9992] pointer-events-none bg-white",
            phase === "in" ? "opacity-100" : "opacity-0"
          )}
          style={{
            transition: "opacity 100ms ease-out",
          }}
        />
      )}

      {/* Film burn */}
      {type === "burn" && (
        <div 
          className="fixed inset-0 z-[9992] pointer-events-none"
          style={{
            background: phase === "in"
              ? "radial-gradient(ellipse at 100% 0%, rgba(255,200,150,0.9) 0%, rgba(255,150,100,0.6) 30%, transparent 70%)"
              : "transparent",
            filter: phase === "in" ? "brightness(3) saturate(0.3)" : "none",
            transition: "all 500ms ease-in-out",
            mixBlendMode: "screen",
          }}
        />
      )}
    </>
  )
}

// Hook for managing transitions
export function useTransition() {
  const [activeTransition, setActiveTransition] = useState<{
    type: TransitionType
    callback: () => void
  } | null>(null)

  const triggerTransition = useCallback((type: TransitionType, callback: () => void) => {
    setActiveTransition({ type, callback })
  }, [])

  const handleComplete = useCallback(() => {
    if (activeTransition?.callback) {
      activeTransition.callback()
    }
    setActiveTransition(null)
  }, [activeTransition])

  return {
    activeTransition,
    triggerTransition,
    handleComplete,
  }
}
