"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { sfx } from "@/lib/sfx-manager"
import { onLightningStrike, type LightningIntensity } from "@/lib/story-beats"
import { onBulletTime, BULLET_TIME_ONSET_MS, BULLET_TIME_HOLD_MS } from "@/lib/bullet-time"

interface ParallaxSystemProps {
  performanceMode: boolean
  /** 0-1, typically page scroll progress. Rain/lightning escalate toward 1 — the story's darkest act should feel like the worst of the storm. */
  stormIntensity?: number
}

// Rain particle class for optimized rendering
interface RainDrop {
  x: number
  y: number
  opacity: number
  thickness: number
  angle: number
  speed: number
  height: number
  drift: number // horizontal drift per frame
  velocity: number // vertical velocity per frame (1.5-3.5px)
}

function generateRainDrops(count: number): RainDrop[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    opacity: 0.15 + Math.random() * 0.4, // 0.15-0.55 (lighter drizzle)
    thickness: 1 + Math.random(), // 1-2px
    angle: 70 + Math.random() * 15, // 70-85deg
    speed: 2.5 + Math.random() * 2, // animation duration in seconds (slower)
    height: 18 + Math.random() * 10, // 18-28px (longer streaks)
    drift: (Math.random() - 0.5) * 0.6, // ±0.3px horizontal drift
    velocity: 1.5 + Math.random() * 2, // 1.5-3.5px per frame (slower fall)
  }))
}

export function ParallaxSystem({ performanceMode, stormIntensity = 0 }: ParallaxSystemProps) {
  const [scrollY, setScrollY] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  const [lightning, setLightning] = useState(false)
  const [strikeShake, setStrikeShake] = useState(false)
  const [rainDrops, setRainDrops] = useState<RainDrop[]>([])
  const [surgeDrops, setSurgeDrops] = useState<RainDrop[]>([])
  const rafRef = useRef<number>()
  const lastScrollRef = useRef(0)
  const lightningTimeoutRef = useRef<NodeJS.Timeout>()
  const intensityRef = useRef(stormIntensity)

  // Keep a ref in sync so the ambient-lightning scheduler (which sets up its
  // own setTimeout chain) always reads the latest intensity without having
  // to be re-created on every scroll tick.
  useEffect(() => {
    intensityRef.current = stormIntensity
  }, [stormIntensity])

  // Initialize rain drops
  useEffect(() => {
    const count = performanceMode ? 30 : 100
    setRainDrops(generateRainDrops(count))
    // Secondary "surge" layer — thinner, faster streaks that fade in only
    // once the story's storm intensity crosses into its heavier second half.
    const surgeCount = performanceMode ? 15 : 50
    setSurgeDrops(generateRainDrops(surgeCount))
  }, [performanceMode])

  // Smooth scroll tracking with RAF
  useEffect(() => {
    setViewportHeight(window.innerHeight)
    
    const handleResize = () => setViewportHeight(window.innerHeight)
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(document.body)

    const updateScroll = () => {
      const currentScroll = window.scrollY
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const scrollProgress = maxScroll > 0 ? currentScroll / maxScroll : 0
      
      // Smooth interpolation
      lastScrollRef.current += (scrollProgress - lastScrollRef.current) * 0.1
      setScrollY(lastScrollRef.current)
      
      rafRef.current = requestAnimationFrame(updateScroll)
    }

    rafRef.current = requestAnimationFrame(updateScroll)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      resizeObserver.disconnect()
    }
  }, [])

  const flicker = useCallback((withShake: boolean) => {
    setLightning(true)
    setTimeout(() => setLightning(false), 50)
    setTimeout(() => setLightning(true), 100)
    setTimeout(() => setLightning(false), 150)
    setTimeout(() => setLightning(true), 200)
    setTimeout(() => setLightning(false), 400)
    if (withShake) {
      setStrikeShake(true)
      setTimeout(() => setStrikeShake(false), 500)
    }
  }, [])

  // Ambient lightning — random distant flicker, visual only. Fires
  // more often as the story's storm intensity rises, so the back half of
  // the site simply feels stormier without any manual per-section wiring.
  useEffect(() => {
    const scheduleLightning = () => {
      const base = 8000 + Math.random() * 22000 // 8-30s at calm baseline
      const delay = base * (1 - intensityRef.current * 0.5) // up to 2x more frequent at full intensity
      lightningTimeoutRef.current = setTimeout(() => {
        flicker(false)
        scheduleLightning()
      }, delay)
    }

    scheduleLightning()

    return () => {
      if (lightningTimeoutRef.current) clearTimeout(lightningTimeoutRef.current)
    }
  }, [flicker])

  // Story-beat strikes — dispatched by <StoryBeatTrigger> markers placed at
  // narrative moments in page.tsx. "close" gets the full treatment: bright
  // flash, real thunder sample, camera shake. "distant" is flash-only, same
  // as the ambient system, just narratively-timed instead of random.
  useEffect(() => {
    return onLightningStrike((intensity: LightningIntensity) => {
      flicker(intensity === "close")
      if (intensity === "close") {
        sfx.play("thunder")
      }
    })
  }, [flicker])

  const [rainSlowFactor, setRainSlowFactor] = useState(1)
  const bulletTimeTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Bullet time genuinely slows the rain — rather than faking "slow motion"
  // purely with an overlay, the one system we fully control (rain fall
  // speed) actually retimes for the duration of the effect.
  useEffect(() => {
    return onBulletTime(() => {
      if (bulletTimeTimeoutRef.current) clearTimeout(bulletTimeTimeoutRef.current)
      setRainSlowFactor(3.2)
      bulletTimeTimeoutRef.current = setTimeout(() => {
        setRainSlowFactor(1)
      }, BULLET_TIME_ONSET_MS + BULLET_TIME_HOLD_MS)
    })
  }, [])

  const layers = performanceMode ? 2 : 4
  const rainOpacity = 0.75 + stormIntensity * 0.5 // drizzle -> heavier downpour as the story darkens
  const surgeVisible = stormIntensity > 0.55

  return (
    <div
      className={cn(
        "fixed inset-0 pointer-events-none overflow-hidden z-0",
        strikeShake && "animate-shake"
      )}
    >
      {/* Lightning flash overlay */}
      <div 
        className={cn(
          "absolute inset-0 z-50 bg-white/90 transition-opacity duration-75",
          lightning ? "opacity-100" : "opacity-0"
        )}
        style={{ willChange: "opacity" }}
      />

      {/* Layer 1: Distant city skyline (0.1x speed) */}
      <div 
        className="absolute inset-x-0 bottom-0 h-[60vh] will-change-transform"
        style={{ 
          transform: `translateZ(0) translateY(${scrollY * viewportHeight * 0.1}px)`,
        }}
      >
        <svg 
          viewBox="0 0 1600 400" 
          className="w-full h-full opacity-10" 
          preserveAspectRatio="xMidYMax slice"
        >
          <path
            fill="currentColor"
            d="M0,400 L0,350 L40,350 L40,280 L80,280 L80,320 L120,320 L120,250 L160,250 L160,290 L200,290 L200,200 L240,200 L240,260 L280,260 L280,180 L320,180 L320,240 L360,240 L360,150 L400,150 L400,220 L440,220 L440,170 L480,170 L480,230 L520,230 L520,140 L560,140 L560,200 L600,200 L600,120 L640,120 L640,180 L680,180 L680,100 L720,100 L720,160 L760,160 L760,130 L800,130 L800,190 L840,190 L840,110 L880,110 L880,170 L920,170 L920,90 L960,90 L960,150 L1000,150 L1000,200 L1040,200 L1040,140 L1080,140 L1080,180 L1120,180 L1120,120 L1160,120 L1160,200 L1200,200 L1200,160 L1240,160 L1240,220 L1280,220 L1280,170 L1320,170 L1320,250 L1360,250 L1360,200 L1400,200 L1400,280 L1440,280 L1440,240 L1480,240 L1480,300 L1520,300 L1520,260 L1560,260 L1560,320 L1600,320 L1600,400 Z"
          />
        </svg>
      </div>

      {/* Layer 2: Mid-distance buildings (0.3x speed) */}
      {layers >= 2 && (
        <div 
          className="absolute inset-x-0 bottom-0 h-[40vh] will-change-transform"
          style={{ 
            transform: `translateZ(0) translateY(${scrollY * viewportHeight * 0.3}px)`,
          }}
        >
          <svg 
            viewBox="0 0 1200 300" 
            className="w-full h-full opacity-15" 
            preserveAspectRatio="xMidYMax slice"
          >
            <path
              fill="currentColor"
              d="M0,300 L0,220 L50,220 L50,150 L100,150 L100,180 L150,180 L150,100 L200,100 L200,160 L250,160 L250,80 L300,80 L300,140 L350,140 L350,60 L400,60 L400,120 L450,120 L450,90 L500,90 L500,150 L550,150 L550,70 L600,70 L600,130 L650,130 L650,50 L700,50 L700,110 L750,110 L750,80 L800,80 L800,140 L850,140 L850,100 L900,100 L900,170 L950,170 L950,130 L1000,130 L1000,190 L1050,190 L1050,150 L1100,150 L1100,210 L1150,210 L1150,180 L1200,180 L1200,300 Z"
            />
          </svg>
        </div>
      )}

      {/* Layer 3: Rain streaks (0.6x speed) — opacity scales with storm intensity */}
      {layers >= 3 && (
        <div 
          className="absolute inset-0 will-change-transform transition-opacity duration-1000"
          style={{ 
            transform: `translateZ(0) translateY(${scrollY * viewportHeight * 0.6}px)`,
            opacity: rainOpacity,
          }}
        >
          {rainDrops.map((drop, i) => (
            <div
              key={i}
              className="absolute animate-rain"
              style={{
                left: `${drop.x}%`,
                top: `${drop.y}%`,
                width: `${drop.thickness}px`,
                height: `${drop.height}px`,
                background: `linear-gradient(${drop.angle}deg, transparent, rgba(255, 255, 255, ${drop.opacity}))`,
                animationDuration: `${drop.speed * rainSlowFactor}s`,
                animationDelay: `${Math.random() * 3}s`,
                transform: `rotate(${90 - drop.angle}deg) translateX(${drop.drift * 10}px)`,
                ["--rain-drift" as string]: `${drop.drift}px`,
                ["--rain-velocity" as string]: `${drop.velocity}`,
              }}
            />
          ))}
        </div>
      )}

      {/* Layer 3b: Storm surge — additional faster/thinner streaks that fade
          in once the story crosses into its heavier second half (roughly
          the Ragna Rock / Punchinello acts onward). Represents the storm
          getting worse as things get worse for Max. */}
      {layers >= 3 && !performanceMode && (
        <div
          className="absolute inset-0 will-change-transform transition-opacity duration-[2000ms]"
          style={{
            transform: `translateZ(0) translateY(${scrollY * viewportHeight * 0.6}px)`,
            opacity: surgeVisible ? Math.min(1, (stormIntensity - 0.55) / 0.45) * 0.6 : 0,
          }}
        >
          {surgeDrops.map((drop, i) => (
            <div
              key={i}
              className="absolute animate-rain"
              style={{
                left: `${drop.x}%`,
                top: `${drop.y}%`,
                width: `${Math.max(0.5, drop.thickness - 0.5)}px`,
                height: `${drop.height * 1.4}px`,
                background: `linear-gradient(${drop.angle}deg, transparent, rgba(200, 210, 255, ${drop.opacity * 0.8}))`,
                animationDuration: `${drop.speed * 0.6 * rainSlowFactor}s`, // faster fall = harder rain
                animationDelay: `${Math.random() * 2}s`,
                transform: `rotate(${90 - drop.angle}deg) translateX(${drop.drift * 10}px)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Layer 4: Foreground elements (1x speed - stationary) */}
      {layers >= 4 && (
        <div className="absolute inset-0 will-change-transform" style={{ transform: "translateZ(0)" }}>
          {/* Vignette overlay */}
          <div 
            className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)",
            }}
          />
        </div>
      )}
    </div>
  )
}

// Optimized film grain using CSS instead of canvas when in performance mode
export function OptimizedFilmGrain({ performanceMode, intensified = false }: { performanceMode: boolean; intensified?: boolean }) {
  if (performanceMode) {
    return null
  }

  return (
    <div 
      className={cn(
        "fixed inset-0 pointer-events-none z-[9999] transition-opacity duration-200",
        intensified ? "opacity-[0.08]" : "opacity-[0.03]"
      )}
      style={{
        top: "-50%",
        left: "-50%",
        right: "-50%",
        bottom: "-50%",
        width: "200%",
        height: "200%",
        background: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\") repeat",
        animation: performanceMode ? "none" : "grain 0.5s steps(10) infinite",
        willChange: "transform",
      }}
    />
  )
}
