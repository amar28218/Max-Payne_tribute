"use client"

/**
 * Bullet time is a discrete, self-contained VFX sequence (onset stutter ->
 * held slow-motion look -> exit), not a literal reprogramming of every
 * animation's timing on the page — that would require refactoring every
 * animated component to read from a shared time-scale variable, which
 * isn't worth the risk of breaking existing effects for this payoff.
 * Instead: the overlay handles its own slow-motion visuals (falling shell
 * casings, blur/desaturate hold, HUD gauge), and the rain in
 * <ParallaxSystem> genuinely slows down for the duration, since that's a
 * single controlled system it's easy to retime honestly.
 */

export const BULLET_TIME_ONSET_MS = 150
export const BULLET_TIME_HOLD_MS = 1500
export const BULLET_TIME_EXIT_MS = 450
export const BULLET_TIME_TOTAL_MS = BULLET_TIME_ONSET_MS + BULLET_TIME_HOLD_MS + BULLET_TIME_EXIT_MS

const EVENT_NAME = "noircity:bullet-time"

export function triggerBulletTime() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(EVENT_NAME))
}

export function onBulletTime(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  window.addEventListener(EVENT_NAME, handler)
  return () => window.removeEventListener(EVENT_NAME, handler)
}
