"use client"

import { useState, useRef, useCallback, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface TiltCardProps {
  children: ReactNode
  className?: string
  maxTilt?: number
  onClick?: () => void
}

export function TiltCard({ children, className, maxTilt = 8, onClick }: TiltCardProps) {
  const [transform, setTransform] = useState("")
  const [shinePosition, setShinePosition] = useState({ x: 50, y: 50 })
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    
    const rotateX = ((y - centerY) / centerY) * -maxTilt
    const rotateY = ((x - centerX) / centerX) * maxTilt
    
    setTransform(`perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`)
    
    // Shine moves opposite to tilt
    const shineX = 100 - ((x / rect.width) * 100)
    const shineY = 100 - ((y / rect.height) * 100)
    setShinePosition({ x: shineX, y: shineY })
  }, [maxTilt])

  const handleMouseLeave = useCallback(() => {
    setTransform("")
    setShinePosition({ x: 50, y: 50 })
  }, [])

  return (
    <div
      ref={cardRef}
      className={cn("relative transition-transform duration-150 ease-out", className)}
      style={{ transform, transformStyle: "preserve-3d" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {children}
      {/* Specular highlight shine */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-200"
        style={{
          background: `radial-gradient(circle at ${shinePosition.x}% ${shinePosition.y}%, rgba(255,255,255,0.12) 0%, transparent 50%)`,
        }}
      />
    </div>
  )
}
