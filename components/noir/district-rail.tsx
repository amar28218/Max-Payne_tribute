"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"

interface DistrictRailProps {
  /** Ordered top-to-bottom, matching the order <DistrictAnchor> markers appear in the page. */
  districts: string[]
  /** 0-1 overall page scroll progress, drives the connecting line's fill. */
  scrollProgress: number
}

/**
 * The vertical "subway line" nav on the edge of the screen — stations light
 * up as the corresponding <DistrictAnchor> scrolls through the center of
 * the viewport. Desktop only (hidden below the lg breakpoint); on mobile
 * the districts are still readable via the chapter cards themselves, this
 * is a wayfinding nicety, not the primary navigation.
 */
export function DistrictRail({ districts, scrollProgress }: DistrictRailProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const elementsRef = useRef<Map<string, HTMLElement>>(new Map())

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-district]"))
    els.forEach((el) => {
      const name = el.getAttribute("data-district")
      if (name) elementsRef.current.set(name, el)
    })

    if (els.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const name = entry.target.getAttribute("data-district")
            const idx = districts.indexOf(name ?? "")
            if (idx !== -1) setActiveIndex(idx)
          }
        })
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    )

    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [districts])

  const handleClick = useCallback((name: string) => {
    elementsRef.current.get(name)?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [])

  const fillPercent = Math.min(100, Math.max(0, scrollProgress * 100))

  return (
    <nav
      aria-label="Story districts"
      className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden lg:block pointer-events-none"
    >
      <div className="relative flex flex-col items-center gap-7 pointer-events-auto py-2">
        {/* Track */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1 bottom-1 w-px bg-border" />
        {/* Progress fill, tied to overall scroll — same value that drives the storm */}
        <div
          className="absolute left-1/2 -translate-x-1/2 top-1 w-px bg-primary transition-all duration-300"
          style={{ height: `${fillPercent}%` }}
        />

        {districts.map((name, i) => {
          const isActive = i === activeIndex
          const isPassed = i < activeIndex
          return (
            <button
              key={name}
              onClick={() => handleClick(name)}
              className="group relative flex items-center"
              data-clickable
              aria-current={isActive ? "true" : undefined}
              aria-label={`Jump to ${name}`}
            >
              {/* Label — absolutely positioned so it never shifts the dot column */}
              <span
                className={cn(
                  "absolute right-full mr-3 font-mono text-[10px] tracking-[0.2em] uppercase whitespace-nowrap transition-all duration-300",
                  isActive
                    ? "text-primary opacity-100 translate-x-0"
                    : "text-muted-foreground opacity-0 translate-x-1 group-hover:opacity-70 group-hover:translate-x-0"
                )}
              >
                {name}
              </span>

              {/* Dot */}
              <span
                className={cn(
                  "relative z-10 rounded-full border transition-all duration-300",
                  isActive
                    ? "w-3 h-3 bg-primary border-primary shadow-[0_0_10px_rgba(220,38,38,0.7)]"
                    : isPassed
                    ? "w-2 h-2 bg-primary/50 border-primary/50"
                    : "w-2 h-2 bg-background border-border group-hover:border-muted-foreground"
                )}
              />
            </button>
          )
        })}
      </div>
    </nav>
  )
}
