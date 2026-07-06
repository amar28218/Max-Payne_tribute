"use client"

import { useState, useCallback, useRef, useEffect } from "react"

const GLITCH_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?/\\~`"

interface GlitchTextProps {
  text: string
  className?: string
}

export function GlitchText({ text, className }: GlitchTextProps) {
  const [displayText, setDisplayText] = useState(text)
  const [isGlitching, setIsGlitching] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const originalTextRef = useRef(text)

  useEffect(() => {
    originalTextRef.current = text
    setDisplayText(text)
  }, [text])

  const glitch = useCallback(() => {
    if (isGlitching) return
    setIsGlitching(true)

    const chars = text.split("")
    const numToGlitch = Math.min(3, Math.max(2, Math.floor(Math.random() * 3) + 2))
    const indicesToGlitch = new Set<number>()
    
    while (indicesToGlitch.size < numToGlitch && indicesToGlitch.size < chars.length) {
      indicesToGlitch.add(Math.floor(Math.random() * chars.length))
    }

    const glitched = chars.map((char, i) => {
      if (indicesToGlitch.has(i) && char !== " ") {
        return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
      }
      return char
    })

    setDisplayText(glitched.join(""))

    timeoutRef.current = setTimeout(() => {
      setDisplayText(originalTextRef.current)
      setIsGlitching(false)
    }, 80)
  }, [text, isGlitching])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <span
      className={className}
      onMouseEnter={glitch}
      style={{ fontFamily: "inherit" }}
    >
      {displayText}
    </span>
  )
}
