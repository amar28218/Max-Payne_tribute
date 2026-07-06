"use client"

import { Howl, Howler } from "howler"

/**
 * Central sound-effect manager built on Howler.js.
 *
 * Every sound is OPTIONAL — if the underlying file at /public/audio/*
 * hasn't been added yet, Howler's onloaderror just no-ops instead of
 * throwing, so the site never breaks because an mp3 is missing.
 *
 * Expected files (see /public/audio/README.md for sourcing suggestions):
 *   /audio/thunder-crack.mp3      one-shot, boot sequence
 *   /audio/rain-loop.mp3          seamless loop, ambient bed
 *   /audio/typewriter-key.mp3     one-shot, short (~80ms), played per character group
 *   /audio/vhs-glitch.mp3         one-shot, boot -> hero transition
 *   /audio/page-turn.mp3          one-shot, chapter transitions
 *   /audio/heartbeat.mp3          one-shot, bullet-time interaction
 *   /audio/ambient-jazz.mp3       looped bed, low volume, optional
 */

type SfxName =
  | "thunder"
  | "rain"
  | "typewriter"
  | "vhsGlitch"
  | "pageTurn"
  | "heartbeat"
  | "ambientJazz"
  | "flashbackEcho"

interface SfxDefinition {
  src: string
  loop?: boolean
  volume?: number
}

const SFX_MAP: Record<SfxName, SfxDefinition> = {
  thunder: { src: "/audio/thunder-crack.mp3", volume: 0.7 },
  rain: { src: "/audio/rain-loop.mp3", loop: true, volume: 0.4 },
  typewriter: { src: "/audio/typewriter-key.mp3", volume: 0.5 },
  vhsGlitch: { src: "/audio/vhs-glitch.mp3", volume: 0.5 },
  pageTurn: { src: "/audio/page-turn.mp3", volume: 0.4 },
  heartbeat: { src: "/audio/heartbeat.mp3", volume: 0.55 },
  ambientJazz: { src: "/audio/ambient-jazz.mp3", loop: true, volume: 0.25 },
  flashbackEcho: { src: "/audio/flashback-echo.mp3", volume: 0.45 },
}

class SfxManager {
  private howls = new Map<SfxName, Howl>()
  private missing = new Set<SfxName>()
  private unlocked = false

  private getHowl(name: SfxName): Howl {
    let howl = this.howls.get(name)
    if (!howl) {
      const def = SFX_MAP[name]
      howl = new Howl({
        src: [def.src],
        loop: !!def.loop,
        volume: def.volume ?? 0.5,
        html5: !!def.loop, // stream loops via HTML5 audio, decode one-shots for low latency
        onloaderror: () => {
          this.missing.add(name)
          if (process.env.NODE_ENV !== "production") {
            console.warn(
              `[sfx-manager] "${name}" (${def.src}) failed to load — add the file to /public/audio to enable this sound.`
            )
          }
        },
      })
      this.howls.set(name, howl)
    }
    return howl
  }

  /** Call once on first user interaction (click) to satisfy browser autoplay policy. */
  unlock() {
    if (this.unlocked) return
    this.unlocked = true
    Howler.autoUnlock = true
  }

  play(name: SfxName): number | null {
    if (this.missing.has(name)) return null
    const howl = this.getHowl(name)
    return howl.play()
  }

  stop(name: SfxName, id?: number) {
    const howl = this.howls.get(name)
    if (!howl) return
    if (id !== undefined) howl.stop(id)
    else howl.stop()
  }

  fadeIn(name: SfxName, to: number, durationMs: number): number | null {
    if (this.missing.has(name)) return null
    const howl = this.getHowl(name)
    const id = howl.play()
    howl.fade(0, to, durationMs, id)
    return id
  }

  fadeOut(name: SfxName, durationMs: number, id?: number) {
    const howl = this.howls.get(name)
    if (!howl) return
    const from = howl.volume() as number
    howl.fade(from, 0, durationMs, id)
    setTimeout(() => this.stop(name, id), durationMs)
  }

  setVolume(name: SfxName, volume: number) {
    this.howls.get(name)?.volume(volume)
  }

  isMissing(name: SfxName): boolean {
    return this.missing.has(name)
  }

  stopAll() {
    this.howls.forEach((howl) => howl.stop())
  }
}

// Singleton — Howler itself manages a single shared AudioContext under the hood.
export const sfx = new SfxManager()
export type { SfxName }
