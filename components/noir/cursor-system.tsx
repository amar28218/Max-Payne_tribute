"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface RippleEffect {
  id: number
  x: number
  y: number
}

export function NoirCursor() {
  const mouseRef = useRef({ x: 0, y: 0 })
  const ghostRef = useRef({ x: 0, y: 0 })

  const cursorRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const spotlightRef = useRef<HTMLDivElement>(null)

  const rafRef = useRef<number>()
  const rippleIdRef = useRef(0)

  const [isVisible, setIsVisible] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isOverText, setIsOverText] = useState(false)
  const [ripples, setRipples] = useState<RippleEffect[]>([])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current.x = e.clientX
    mouseRef.current.y = e.clientY

    if (!isVisible) setIsVisible(true)

    const target = e.target as HTMLElement

    const isClickable =
      target.tagName === "BUTTON" ||
      target.tagName === "A" ||
      target.closest("button") ||
      target.closest("a") ||
      target.closest("[role='button']") ||
      target.hasAttribute("data-clickable") ||
      target.closest("[data-clickable]") ||
      target.classList.contains("character-card") ||
      target.closest(".character-card") ||
      target.closest(".comic-panel") ||
      target.closest("[data-interactive]") ||
      window.getComputedStyle(target).cursor === "pointer"

    const isText =
      (
        target.tagName === "P" ||
        target.closest("p") ||
        target.classList.contains("prose") ||
        target.closest(".prose")
      ) &&
      !isClickable

    setIsHovering(isClickable)
    setIsOverText(Boolean(isText))
  }, [isVisible])

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false)
  }, [])

  const handleMouseDown = useCallback((e: MouseEvent) => {
    const ripple = {
      id: rippleIdRef.current++,
      x: e.clientX,
      y: e.clientY,
    }

    setRipples(prev => [...prev, ripple])

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== ripple.id))
    }, 350)
  }, [])

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)
    document.addEventListener("mousedown", handleMouseDown)

    document.body.style.cursor = "none"

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
      document.removeEventListener("mousedown", handleMouseDown)

      document.body.style.cursor = "auto"
    }
  }, [handleMouseMove, handleMouseLeave, handleMouseDown])

  useEffect(() => {
    const animate = () => {
      ghostRef.current.x +=
        (mouseRef.current.x - ghostRef.current.x) * 0.18

      ghostRef.current.y +=
        (mouseRef.current.y - ghostRef.current.y) * 0.18

      if (cursorRef.current) {
        cursorRef.current.style.transform =
          `translate3d(${ghostRef.current.x}px, ${ghostRef.current.y}px,0) translate(-50%,-50%)`
      }

      if (dotRef.current) {
        dotRef.current.style.transform =
          `translate3d(${mouseRef.current.x}px, ${mouseRef.current.y}px,0) translate(-50%,-50%)`
      }

      if (spotlightRef.current) {
        spotlightRef.current.style.background =
          `radial-gradient(circle 260px at ${mouseRef.current.x}px ${mouseRef.current.y}px,
          rgba(255,255,255,0.025) 0%,
          rgba(255,255,255,0.015) 35%,
          transparent 75%)`
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  if (!isVisible) return null

  return (
    <>
      <div
        ref={spotlightRef}
        className="fixed inset-0 pointer-events-none z-[9997]"
        style={{
          mixBlendMode: "overlay",
        }}
      />

      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="fixed pointer-events-none z-[9998] rounded-full border border-white/50"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: "translate(-50%,-50%)",
            animation: "cursor-ripple 350ms ease-out forwards",
          }}
        />
      ))}

            {/* Outer Ghost Ring */}
      <div
        ref={cursorRef}
        className="fixed pointer-events-none z-[9998] will-change-transform"
        style={{
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* Main Ring */}
        <div
          className={`absolute rounded-full border transition-all duration-200 ${
            isHovering ? "border-red-500" : "border-white/70"
          }`}
          style={{
            width: isHovering ? 44 : isOverText ? 18 : 28,
            height: isHovering ? 44 : isOverText ? 18 : 28,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Soft Pulse */}
        <div
          className={`absolute rounded-full border animate-ping ${
            isHovering ? "border-red-500/30" : "border-white/20"
          }`}
          style={{
            width: isHovering ? 54 : 38,
            height: isHovering ? 54 : 38,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            animationDuration: "2s",
          }}
        />

        {/* Inner Ring */}
        <div
          className={`absolute rounded-full border ${
            isHovering ? "border-red-400/60" : "border-white/40"
          }`}
          style={{
            width: isHovering ? 14 : 8,
            height: isHovering ? 14 : 8,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>

      {/* Main Cursor Dot */}
      <div
        ref={dotRef}
        className="fixed pointer-events-none z-[9999] will-change-transform"
        style={{
          transform: "translate(-50%, -50%)",
        }}
      >
        <div
          className={`rounded-full transition-all duration-150 ${
            isHovering ? "bg-red-500" : "bg-white"
          }`}
          style={{
            width: isHovering ? 10 : 8,
            height: isHovering ? 10 : 8,
          }}
        />
      </div>

      <style jsx global>{`
        @keyframes cursor-ripple {
          0% {
            width: 10px;
            height: 10px;
            opacity: 0.5;
            transform: translate(-50%, -50%) scale(1);
          }

          100% {
            width: 60px;
            height: 60px;
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.5);
          }
        }

        * {
          cursor: none !important;
        }
      `}</style>
    </>
  )
}
