"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { sfx } from "@/lib/sfx-manager"

/**
 * ===========================================================================
 * EDIT ME — narration lines
 * ===========================================================================
 * These are placeholders. Replace with your own chosen lines — Claude does
 * not generate the game's original script text here (see project plan for
 * why). Keep each line short (under ~90 characters) so the typewriter
 * timing below still reads comfortably on mobile.
 * ===========================================================================
 */
const BOOT_LINES = [
  "EDIT_ME: first narration line goes here.",
  "EDIT_ME: second narration line goes here.",
]

type Stage = "idle" | "flash" | "typing" | "glitch" | "done"

const SESSION_KEY = "noircity_boot_seen"
const MS_PER_CHAR = 45
const SKIP_LINK_DELAY_MS = 3000

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [stage, setStage] = useState<Stage>("idle")
  const [lineIndex, setLineIndex] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [showSkip, setShowSkip] = useState(false)
  const [alreadySeen, setAlreadySeen] = useState(true) // default true to avoid boot flash-of-content before mount check
  const reducedMotion = useRef(false)
  const typeTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Check session flag + reduced motion preference on mount (client-only)
  useEffect(() => {
    reducedMotion.current = prefersReducedMotion()
    const seen = sessionStorage.getItem(SESSION_KEY) === "1"
    setAlreadySeen(seen)
    if (seen) {
      onComplete()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Skip link appears after a delay so early clicks aren't accidental
  useEffect(() => {
    if (stage === "idle") return
    const t = setTimeout(() => setShowSkip(true), SKIP_LINK_DELAY_MS)
    return () => clearTimeout(t)
  }, [stage])

  const finish = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, "1")
    setStage("done")
    onComplete()
  }, [onComplete])

  const handleEnter = useCallback(() => {
    sfx.unlock()

    if (reducedMotion.current) {
      // Simplified path: no flash/glitch/shake, just a plain fade with the text.
      setStage("typing")
      return
    }

    setStage("flash")
    sfx.play("thunder")
    sfx.fadeIn("rain", 0.4, 2000)

    // Flash animation runs ~700ms (see .animate-boot-flash), then start typing
    setTimeout(() => setStage("typing"), 750)
  }, [])

  // Typewriter effect — advances one character at a time, plays a tick
  // sound every couple of characters (not every single one, to avoid
  // machine-gunning the sample).
  useEffect(() => {
    if (stage !== "typing") return

    const currentLine = BOOT_LINES[lineIndex]
    if (!currentLine) return

    if (charCount < currentLine.length) {
      typeTimeoutRef.current = setTimeout(() => {
        setCharCount((c) => c + 1)
        if (charCount % 2 === 0) sfx.play("typewriter")
      }, MS_PER_CHAR)
      return () => clearTimeout(typeTimeoutRef.current)
    }

    // Line finished — pause, then advance to next line or move on
    const pause = setTimeout(() => {
      if (lineIndex < BOOT_LINES.length - 1) {
        setLineIndex((i) => i + 1)
        setCharCount(0)
      } else {
        setStage(reducedMotion.current ? "done" : "glitch")
      }
    }, 1100)

    return () => clearTimeout(pause)
  }, [stage, charCount, lineIndex])

  // Glitch transition -> reveal hero
  useEffect(() => {
    if (stage !== "glitch") return
    sfx.play("vhsGlitch")
    const t = setTimeout(() => finish(), 550)
    return () => clearTimeout(t)
  }, [stage, finish])

  // Reduced-motion path finishes right after typing completes
  useEffect(() => {
    if (stage === "done" && reducedMotion.current) finish()
  }, [stage, finish])

  if (alreadySeen || stage === "done") return null

  const currentLine = BOOT_LINES[lineIndex] ?? ""
  const visibleText = currentLine.slice(0, charCount)

  return (
    <div
      className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
      role="dialog"
      aria-label="Opening sequence"
    >
      {/* Thunder flash */}
      {stage === "flash" && (
        <div className="absolute inset-0 bg-white animate-boot-flash" />
      )}

      {/* VHS glitch out */}
      {stage === "glitch" && (
        <div className="absolute inset-0 bg-black vhs-scanlines animate-vhs-glitch" />
      )}

      {/* Idle: click-to-enter prompt */}
      {stage === "idle" && (
        <button
          onClick={handleEnter}
          className="font-mono text-muted-foreground hover:text-primary text-sm tracking-[0.4em] uppercase transition-colors duration-500 animate-pulse"
          autoFocus
        >
          Click to Enter
        </button>
      )}

      {/* Typewriter narration */}
      {stage === "typing" && (
        <div className="max-w-xl px-6 text-center">
          <p className="font-mono text-lg md:text-2xl text-foreground/90 leading-relaxed">
            {visibleText}
            <span className="typewriter-cursor inline-block w-[0.5em] h-[1em] bg-foreground/80 align-middle ml-1" />
          </p>
        </div>
      )}

      {/* Skip link */}
      {showSkip && stage !== "idle" && stage !== "glitch" && (
        <button
          onClick={finish}
          className="absolute bottom-8 right-8 font-mono text-xs text-muted-foreground/60 hover:text-primary tracking-widest uppercase transition-colors"
        >
          Skip Intro
        </button>
      )}
    </div>
  )
}
