"use client"

export const FLASHBACK_DURATION_MS = 2400

const EVENT_NAME = "noircity:flashback"

export function triggerFlashback() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(EVENT_NAME))
}

export function onFlashback(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  window.addEventListener(EVENT_NAME, handler)
  return () => window.removeEventListener(EVENT_NAME, handler)
}
