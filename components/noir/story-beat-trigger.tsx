"use client"

import { useEffect, useRef } from "react"
import { triggerLightningStrike, type LightningIntensity } from "@/lib/story-beats"

interface StoryBeatTriggerProps {
  /** "close" = flash + thunder sample + camera shake. "distant" = flash only. */
  intensity?: LightningIntensity
  /** Fire again on re-entry (e.g. scrolling back up and down)? Default: once per page load. */
  once?: boolean
}

/**
 * Drop this inside any section as a narrative marker. It renders nothing
 * visually — it just watches for its own position crossing the vertical
 * center band of the viewport and fires a synced lightning strike at that
 * moment, so the storm reacts to *where the story is*, not just a clock.
 */
export function StoryBeatTrigger({ intensity = "close", once = true }: StoryBeatTriggerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const firedRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && (!once || !firedRef.current)) {
            firedRef.current = true
            triggerLightningStrike(intensity)
          }
        })
      },
      // Fire as the marker crosses the middle band of the viewport, rather
      // than the moment it technically enters — reads as better-timed.
      { rootMargin: "-42% 0px -42% 0px", threshold: 0 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [intensity, once])

  return <div ref={ref} aria-hidden="true" className="h-px w-full" />
}
