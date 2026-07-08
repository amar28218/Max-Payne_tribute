"use client"

import { useState, useEffect, useRef, useCallback } from "react"

// Debounced mouse position hook (16ms = ~60fps)
export function useDebouncedMouse() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const lastUpdateRef = useRef(0)
  const rafRef = useRef<number | undefined>(undefined)
  const pendingPositionRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      pendingPositionRef.current = { x: e.clientX, y: e.clientY }
    }

    const updatePosition = () => {
      const now = performance.now()
      if (now - lastUpdateRef.current >= 16) {
        setPosition(pendingPositionRef.current)
        lastUpdateRef.current = now
      }
      rafRef.current = requestAnimationFrame(updatePosition)
    }

    document.addEventListener("mousemove", handleMouseMove, { passive: true })
    rafRef.current = requestAnimationFrame(updatePosition)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return position
}

// Intersection observer hook for visibility detection
export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const elementsRef = useRef<Set<Element>>(new Set())

  useEffect(() => {
    observerRef.current = new IntersectionObserver(callback, {
      threshold: 0.1,
      ...options,
    })

    // Observe any elements that were added before observer was created
    elementsRef.current.forEach(el => observerRef.current?.observe(el))

    return () => {
      observerRef.current?.disconnect()
    }
  }, [callback, options])

  const observe = useCallback((element: Element | null) => {
    if (element) {
      elementsRef.current.add(element)
      observerRef.current?.observe(element)
    }
  }, [])

  const unobserve = useCallback((element: Element | null) => {
    if (element) {
      elementsRef.current.delete(element)
      observerRef.current?.unobserve(element)
    }
  }, [])

  return { observe, unobserve }
}

// Resize observer hook
export function useResizeObserver(
  callback: (entries: ResizeObserverEntry[]) => void
) {
  const observerRef = useRef<ResizeObserver | null>(null)
  const elementsRef = useRef<Set<Element>>(new Set())

  useEffect(() => {
    observerRef.current = new ResizeObserver(callback)

    elementsRef.current.forEach(el => observerRef.current?.observe(el))

    return () => {
      observerRef.current?.disconnect()
    }
  }, [callback])

  const observe = useCallback((element: Element | null) => {
    if (element) {
      elementsRef.current.add(element)
      observerRef.current?.observe(element)
    }
  }, [])

  return { observe }
}

// Scroll progress hook using IntersectionObserver instead of scroll events
export function useScrollProgress() {
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number | undefined>(undefined)
  const lastScrollRef = useRef(0)

  useEffect(() => {
    const updateScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const newProgress = docHeight > 0 ? scrollTop / docHeight : 0
      
      // Only update if changed significantly (reduces re-renders)
      if (Math.abs(newProgress - lastScrollRef.current) > 0.001) {
        lastScrollRef.current = newProgress
        setProgress(newProgress)
      }
      
      rafRef.current = requestAnimationFrame(updateScroll)
    }

    rafRef.current = requestAnimationFrame(updateScroll)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return progress
}

// Performance mode detection
export function usePerformanceMode() {
  const [isLowEnd, setIsLowEnd] = useState(false)

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    
    // Check for low-end device indicators
    const isMobile = window.innerWidth <= 768
    const hasLowMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory !== undefined 
      && (navigator as Navigator & { deviceMemory?: number }).deviceMemory! < 4
    const hasSlowConnection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType === "slow-2g" 
      || (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType === "2g"

    setIsLowEnd(prefersReducedMotion || hasLowMemory || hasSlowConnection || (isMobile && hasLowMemory))
  }, [])

  return isLowEnd
}

// Touch gestures hook for mobile swipe navigation
export function useTouchGestures(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold = 50
) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const [isSwiping, setIsSwiping] = useState(false)

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      }
      setIsSwiping(true)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current || !isSwiping) return

      const deltaX = e.touches[0].clientX - touchStartRef.current.x
      const deltaY = e.touches[0].clientY - touchStartRef.current.y

      // If vertical scroll is dominant, don't interfere
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        touchStartRef.current = null
        setIsSwiping(false)
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || !isSwiping) return

      const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x

      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          onSwipeRight?.()
        } else {
          onSwipeLeft?.()
        }
      }

      touchStartRef.current = null
      setIsSwiping(false)
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: true })
    document.addEventListener("touchmove", handleTouchMove, { passive: true })
    document.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [onSwipeLeft, onSwipeRight, threshold, isSwiping])

  return isSwiping
}

// RAF-based animation loop
export function useAnimationLoop(callback: (deltaTime: number) => void, enabled = true) {
  const rafRef = useRef<number | undefined>(undefined)
  const lastTimeRef = useRef(0)

  useEffect(() => {
    if (!enabled) return

    const animate = (time: number) => {
      const deltaTime = lastTimeRef.current ? time - lastTimeRef.current : 16
      lastTimeRef.current = time
      callback(deltaTime)
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [callback, enabled])
}

// Check if running on mobile
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener("resize", checkMobile, { passive: true })
    
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return isMobile
}
