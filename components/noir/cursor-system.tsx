"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface RippleEffect {
  id: number
  x: number
  y: number
}

export function NoirCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [ghostPosition, setGhostPosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isOverText, setIsOverText] = useState(false)
  const [ripples, setRipples] = useState<RippleEffect[]>([])
  const rafRef = useRef<number>()
  const ghostRef = useRef({ x: 0, y: 0 })
  const rippleIdRef = useRef(0)

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setPosition({ x: e.clientX, y: e.clientY })
    setIsVisible(true)

    // Check what element we're hovering
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

    // Check if over paragraph/text content (not clickable)
    const isText = 
      (target.tagName === "P" ||
       target.closest("p") !== null ||
       target.classList.contains("prose") || 
       target.closest(".prose")) &&
      !isClickable

    setIsHovering(isClickable)
    setIsOverText(isText)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false)
  }, [])

  const handleMouseDown = useCallback((e: MouseEvent) => {
    // Create ripple effect
    const newRipple: RippleEffect = {
      id: rippleIdRef.current++,
      x: e.clientX,
      y: e.clientY,
    }
    setRipples(prev => [...prev, newRipple])

    // Remove ripple after animation completes (350ms)
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id))
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

  // Ghost ring follows with 0.12 lerp easing - always catching up, never snapping
  useEffect(() => {
    const animate = () => {
      ghostRef.current.x += (position.x - ghostRef.current.x) * 0.12
      ghostRef.current.y += (position.y - ghostRef.current.y) * 0.12
      setGhostPosition({ x: ghostRef.current.x, y: ghostRef.current.y })
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [position])

  if (!isVisible) return null

  return (
    <>
      {/* Spotlight effect - radial gradient vignette centered on cursor */}
      <div
        className="fixed inset-0 pointer-events-none z-[9997] transition-opacity duration-100"
        style={{
          background: `radial-gradient(circle 200px at ${position.x}px ${position.y}px, rgba(255,255,255,0.04) 0%, transparent 70%)`,
          mixBlendMode: "overlay",
        }}
      />

      {/* Click ripples - expanding circles that fade out */}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="fixed pointer-events-none z-[9998] rounded-full border border-white/50"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: "translate(-50%, -50%)",
            animation: "cursor-ripple 350ms ease-out forwards",
          }}
        />
      ))}

      {/* Outer ring - 28px, follows with delay, morphs to 44px red on hover */}
      <div
        className="fixed pointer-events-none z-[9998]"
        style={{
          left: ghostPosition.x,
          top: ghostPosition.y,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div
          className="rounded-full transition-all duration-150 ease-out"
          style={{
            width: isHovering ? 44 : 28,
            height: isHovering ? 44 : 28,
            borderWidth: 1,
            borderStyle: "solid",
            borderColor: isHovering ? "rgba(200, 30, 30, 0.6)" : "rgba(255, 255, 255, 0.8)",
            opacity: isOverText ? 0 : 1,
            transition: "width 150ms ease-out, height 150ms ease-out, border-color 150ms ease-out, opacity 150ms ease-out",
          }}
        />
      </div>

      {/* Main dot cursor - 8px solid white, snaps exactly to mouse with zero lag */}
      <div
        className="fixed pointer-events-none z-[9999]"
        style={{
          left: position.x,
          top: position.y,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div
          className="rounded-full bg-white"
          style={{
            width: 8,
            height: 8,
          }}
        />
      </div>

      {/* CSS for ripple animation */}
      <style jsx global>{`
        @keyframes cursor-ripple {
          0% {
            width: 10px;
            height: 10px;
            opacity: 0.5;
          }
          100% {
            width: 50px;
            height: 50px;
            opacity: 0;
          }
        }
      `}</style>
    </>
  )
}
