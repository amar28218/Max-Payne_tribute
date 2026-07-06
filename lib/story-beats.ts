"use client"

/**
 * A "story beat" is a scroll-triggered moment (a chapter reveal, a climax
 * quote, the entrance to a darker section) that should sync the lightning
 * system to something narrative rather than a pure random timer.
 *
 * "distant" strikes are visual-only flicker (same as the old ambient
 * random lightning). "close" strikes are the punctuated ones: a brighter
 * flash, a real thunder-crack sample, and a brief camera shake — reserved
 * for genuine narrative beats so they read as intentional, not spammy.
 */

export type LightningIntensity = "distant" | "close"

const EVENT_NAME = "noircity:lightning-strike"

export function triggerLightningStrike(intensity: LightningIntensity = "distant") {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<LightningIntensity>(EVENT_NAME, { detail: intensity }))
}

export function onLightningStrike(handler: (intensity: LightningIntensity) => void): () => void {
  if (typeof window === "undefined") return () => {}
  const listener = (e: Event) => handler((e as CustomEvent<LightningIntensity>).detail)
  window.addEventListener(EVENT_NAME, listener)
  return () => window.removeEventListener(EVENT_NAME, listener)
}
