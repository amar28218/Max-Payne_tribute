"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

// Hook to track read paragraphs
export function useReadParagraphs() {
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  const markAsRead = useCallback((id: string) => {
    setReadIds(prev => new Set([...prev, id]))
  }, [])

  return { readIds, markAsRead }
}

// Hook for escape key dismissal
export function useEscapeDismiss(onDismiss: () => void, isActive: boolean) {
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onDismiss()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onDismiss, isActive])
}

// Interactive heading with draw underline
export function InteractiveHeading({
  as: Component = "h2",
  children,
  className,
}: {
  as?: "h1" | "h2" | "h3"
  children: React.ReactNode
  className?: string
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Component
      className={cn("relative inline-block cursor-default", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-clickable
    >
      {children}
      <span
        className="absolute bottom-0 left-0 h-px bg-primary transition-all duration-300 ease-out"
        style={{ width: isHovered ? "100%" : "0%" }}
      />
    </Component>
  )
}

// Interactive paragraph with read highlight
export function InteractiveParagraph({
  children,
  id,
  isRead,
  onRead,
  className,
}: {
  children: React.ReactNode
  id: string
  isRead: boolean
  onRead: (id: string) => void
  className?: string
}) {
  const handleClick = useCallback(() => {
    onRead(id)
  }, [id, onRead])

  return (
    <p
      onClick={handleClick}
      className={cn(
        "transition-colors duration-300 cursor-text",
        isRead && "bg-amber-900/10",
        className
      )}
      data-paragraph-id={id}
    >
      {children}
    </p>
  )
}

// Interactive hero title with letter effects
export function InteractiveTitle({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [isScattered, setIsScattered] = useState(false)
  const scatterTimeoutRef = useRef<NodeJS.Timeout>()

  const handleLetterHover = useCallback((index: number) => {
    setHoveredIndex(index)
  }, [])

  const handleClick = useCallback(() => {
    if (isScattered) return
    setIsScattered(true)
    
    // Return after animation
    scatterTimeoutRef.current = setTimeout(() => {
      setIsScattered(false)
    }, 800)
  }, [isScattered])

  useEffect(() => {
    return () => {
      if (scatterTimeoutRef.current) clearTimeout(scatterTimeoutRef.current)
    }
  }, [])

  return (
    <span
      className={cn("inline-flex cursor-pointer", className)}
      onClick={handleClick}
      data-clickable
    >
      {text.split("").map((letter, i) => {
        const scatterX = isScattered ? (Math.random() - 0.5) * 100 : 0
        const scatterY = isScattered ? (Math.random() - 0.5) * 60 : 0
        const isHovered = hoveredIndex === i

        return (
          <span
            key={i}
            className="inline-block transition-all"
            style={{
              transform: `translate(${scatterX}px, ${scatterY + (isHovered ? -4 : 0)}px)`,
              opacity: isHovered ? 1 : undefined,
              transition: isScattered
                ? "transform 300ms ease-out"
                : "transform 150ms ease-out, opacity 80ms ease-out",
            }}
            onMouseEnter={() => handleLetterHover(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {letter === " " ? "\u00A0" : letter}
          </span>
        )
      })}
    </span>
  )
}

// Scroll indicator with tooltip
export function InteractiveScrollIndicator({
  targetId,
  tooltip = "Enter the city",
}: {
  targetId: string
  tooltip?: string
}) {
  const [showTooltip, setShowTooltip] = useState(false)

  const handleClick = useCallback(() => {
    const target = document.getElementById(targetId)
    if (target) {
      target.scrollIntoView({ behavior: "smooth" })
    }
  }, [targetId])

  return (
    <div
      className="relative flex flex-col items-center gap-2 cursor-pointer"
      onClick={handleClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      data-clickable
    >
      {/* Tooltip */}
      <span
        className={cn(
          "absolute -top-8 font-mono text-xs text-primary tracking-widest uppercase whitespace-nowrap transition-all duration-200",
          showTooltip ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}
      >
        {tooltip}
      </span>

      <span className="font-mono text-xs tracking-widest uppercase text-muted-foreground">
        Scroll
      </span>
      <div className="w-px h-16 bg-gradient-to-b from-primary to-transparent animate-pulse" />
    </div>
  )
}

// Interactive chapter card with expanded content
export function InteractiveChapterCard({
  chapter,
  title,
  description,
  year,
  extendedContent,
  tags = [],
  isFiltered,
  onTagClick,
  children,
}: {
  chapter: string
  title: string
  description: string
  year: string
  extendedContent: string
  tags?: string[]
  isFiltered: boolean
  onTagClick: (tag: string) => void
  children?: React.ReactNode
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showCopied, setShowCopied] = useState(false)
  const [borderAnimating, setBorderAnimating] = useState(false)

  const handleChapterClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(title)
    setShowCopied(true)
    setTimeout(() => setShowCopied(false), 1500)
  }, [title])

  const handleCardClick = useCallback(() => {
    setIsExpanded(!isExpanded)
    setBorderAnimating(true)
    setTimeout(() => setBorderAnimating(false), 1000)
  }, [isExpanded])

  return (
    <div
      className={cn(
        "comic-panel bg-card p-8 md:p-12 transition-all duration-500 cursor-pointer group relative overflow-hidden",
        isFiltered && "opacity-30 pointer-events-none"
      )}
      onClick={handleCardClick}
      data-clickable
    >
      {/* Animated border */}
      {borderAnimating && (
        <div className="absolute inset-0 pointer-events-none">
          <svg className="absolute inset-0 w-full h-full">
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="none"
              stroke="oklch(0.58 0.22 25)"
              strokeWidth="2"
              strokeDasharray="1000"
              strokeDashoffset="1000"
              className="animate-border-trace"
            />
          </svg>
        </div>
      )}

      {/* Chapter number */}
      <div className="flex items-start justify-between mb-6">
        <span
          className="font-sans text-6xl md:text-8xl text-muted/30 group-hover:text-primary/30 transition-colors cursor-pointer relative"
          onClick={handleChapterClick}
          data-clickable
        >
          {chapter}
          {showCopied && (
            <span className="absolute -top-4 left-0 font-mono text-xs text-primary animate-fade-up">
              Copied!
            </span>
          )}
        </span>
        <span className="font-mono text-xs text-muted-foreground tracking-widest">
          {year}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-sans text-3xl md:text-4xl mb-4 group-hover:text-primary transition-colors">
        {children || title}
      </h3>

      {/* Description */}
      <p className="font-serif text-muted-foreground text-lg leading-relaxed italic">
        {description}
      </p>

      {/* Extended content */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-500",
          isExpanded ? "max-h-40 opacity-100 mt-4" : "max-h-0 opacity-0"
        )}
      >
        <p className="font-serif text-muted-foreground/80 text-base leading-relaxed border-t border-border pt-4">
          {extendedContent}
        </p>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {tags.map(tag => (
            <button
              key={tag}
              onClick={(e) => {
                e.stopPropagation()
                onTagClick(tag)
              }}
              className="font-mono text-xs px-2 py-1 bg-muted/30 hover:bg-primary/20 hover:text-primary transition-colors"
              data-clickable
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Decorative line */}
      <div className="mt-8 h-px bg-gradient-to-r from-primary/50 via-border to-transparent w-0 group-hover:w-full transition-all duration-500" />

      <style jsx>{`
        @keyframes animate-border-trace {
          to {
            stroke-dashoffset: 0;
          }
        }
        .animate-border-trace {
          animation: animate-border-trace 1s ease-out forwards;
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up {
          animation: fade-up 200ms ease-out;
        }
      `}</style>
    </div>
  )
}

// Interactive quote with word highlight and type-delete effect
export function InteractiveQuote({
  quote,
  author,
}: {
  quote: string
  author: string
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [hoveredWordIndex, setHoveredWordIndex] = useState<number | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [displayText, setDisplayText] = useState(quote)
  const [isLongPress, setIsLongPress] = useState(false)
  const [showBurnEffect, setShowBurnEffect] = useState(false)
  const longPressTimerRef = useRef<NodeJS.Timeout>()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const handleClick = useCallback(() => {
    if (isTyping) return
    setIsTyping(true)

    // Erase character by character
    let i = quote.length
    const eraseInterval = setInterval(() => {
      if (i > 0) {
        setDisplayText(quote.slice(0, i - 1))
        i--
      } else {
        clearInterval(eraseInterval)
        
        // Retype character by character
        let j = 0
        const typeInterval = setInterval(() => {
          if (j < quote.length) {
            setDisplayText(quote.slice(0, j + 1))
            j++
          } else {
            clearInterval(typeInterval)
            setIsTyping(false)
          }
        }, 35)
      }
    }, 25)
  }, [quote, isTyping])

  const handleMouseDown = useCallback(() => {
    longPressTimerRef.current = setTimeout(() => {
      setShowBurnEffect(true)
      setTimeout(() => setShowBurnEffect(false), 500)
    }, 400)
  }, [])

  const handleMouseUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
    }
  }, [])

  const words = displayText.split(/(\s+)/)

  return (
    <section
      ref={ref}
      className={cn(
        "relative py-32 px-6 noir-vignette transition-all duration-1000",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}
    >
      <div className="max-w-4xl mx-auto text-center">
        {/* Opening quote mark */}
        <span className="font-serif text-[12rem] leading-none text-primary/20 block -mb-24">
          &ldquo;
        </span>

        <blockquote
          className={cn(
             "font-serif text-3xl md:text-5xl leading-tight text-foreground italic cursor-pointer relative whitespace-pre-wrap",
              showBurnEffect && "text-white"
          )}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          data-clickable
          style={{
            textShadow: showBurnEffect ? "0 0 40px white, 0 0 80px white" : undefined,
            transition: "text-shadow 200ms ease-out",
          }}
        >
          {words.map((part, i) => (
            <span
              key={i}
              className="inline-block transition-all duration-150"
              style={{
                filter: hoveredWordIndex !== null && Math.abs(hoveredWordIndex - i) <= 1 
                  ? "brightness(1.2)" 
                  : "brightness(1)",
                transitionDelay: `${i * 150}ms`,
              }}
              onMouseEnter={() => setHoveredWordIndex(i)}
              onMouseLeave={() => setHoveredWordIndex(null)}
            >
             {part}
            </span>
          ))}
          {isTyping && <span className="animate-pulse">|</span>}
        </blockquote>

        <cite className="block mt-8 font-mono text-sm text-muted-foreground tracking-widest uppercase not-italic">
          — {author}
        </cite>
      </div>
    </section>
  )
}

// Interactive scene button with context menu
export function InteractiveSceneButton({
  scene,
  isActive,
  isVisited,
  description,
  onClick,
  onSetDefault,
  onMarkVisited,
  disabled,
}: {
  scene: { id: number; name: string; transitionLabel: string }
  isActive: boolean
  isVisited: boolean
  description: string
  onClick: () => void
  onSetDefault: () => void
  onMarkVisited: () => void
  disabled: boolean
}) {
  const [showDescription, setShowDescription] = useState(false)
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const rect = buttonRef.current?.getBoundingClientRect()
    if (rect) {
      setContextMenuPos({ x: e.clientX - rect.left, y: e.clientY - rect.top + 10 })
      setShowContextMenu(true)
    }
  }, [])

  useEscapeDismiss(() => setShowContextMenu(false), showContextMenu)

  // Close context menu on click outside
  useEffect(() => {
    if (!showContextMenu) return
    const handleClick = () => setShowContextMenu(false)
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [showContextMenu])

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={onClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setShowDescription(true)}
        onMouseLeave={() => setShowDescription(false)}
        disabled={disabled}
        className={cn(
          "px-6 py-3 border transition-all duration-300 font-mono text-sm tracking-widest uppercase flex flex-col items-center gap-1 relative",
          isActive
            ? "bg-primary border-primary text-primary-foreground"
            : "bg-transparent border-border text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        data-clickable
      >
        <span className="flex items-center gap-2">
          {scene.name}
          {isVisited && <span className="text-primary text-xs">✓</span>}
        </span>
        <span className={cn(
          "text-[10px] opacity-60",
          isActive ? "text-primary-foreground" : "text-muted-foreground"
        )}>
          [{scene.transitionLabel}]
        </span>
      </button>

      {/* Hover description */}
      <div
        className={cn(
          "absolute top-full left-1/2 -translate-x-1/2 mt-2 font-mono text-xs text-muted-foreground whitespace-nowrap transition-all duration-200 pointer-events-none",
          showDescription && !showContextMenu ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        )}
      >
        {description}
      </div>

      {/* Custom context menu */}
      {showContextMenu && (
        <div
          className="absolute z-50 bg-card border border-border shadow-lg py-1 min-w-[180px]"
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
          onClick={e => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-4 py-2 font-mono text-xs hover:bg-muted/50 transition-colors flex items-center justify-between"
            onClick={() => {
              onSetDefault()
              setShowContextMenu(false)
            }}
            data-clickable
          >
            Set as default view
          </button>
          <button
            className="w-full text-left px-4 py-2 font-mono text-xs hover:bg-muted/50 transition-colors flex items-center justify-between"
            onClick={() => setShowContextMenu(false)}
            data-clickable
          >
            Read scene notes
          </button>
          <button
            className="w-full text-left px-4 py-2 font-mono text-xs hover:bg-muted/50 transition-colors flex items-center justify-between"
            onClick={() => {
              onMarkVisited()
              setShowContextMenu(false)
            }}
            data-clickable
          >
            Mark as visited
            {isVisited && <span className="text-primary">✓</span>}
          </button>
        </div>
      )}
    </div>
  )
}

// Building click handler for skyline
export function InteractiveSkyline({ className }: { className?: string }) {
  const [litWindows, setLitWindows] = useState<Array<{ id: number; x: number; y: number }>>([])
  const windowIdRef = useRef(0)

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newWindow = {
      id: windowIdRef.current++,
      x: x + (Math.random() - 0.5) * 20,
      y: Math.min(y, rect.height - 40) + Math.random() * 20,
    }

    setLitWindows(prev => [...prev, newWindow])

    // Fade out after 3 seconds
    setTimeout(() => {
      setLitWindows(prev => prev.filter(w => w.id !== newWindow.id))
    }, 3000)
  }, [])

  return (
    <div
      className={cn("absolute inset-0 cursor-pointer", className)}
      onClick={handleClick}
      data-clickable
    >
      {/* Lit windows */}
      {litWindows.map(win => (
        <div
          key={win.id}
          className="absolute w-2 h-3 bg-yellow-300/80 animate-pulse"
          style={{
            left: win.x,
            top: win.y,
            boxShadow: "0 0 10px 2px rgba(253, 224, 71, 0.5)",
            animation: "window-fade 3s ease-out forwards",
          }}
        />
      ))}
      
      <style jsx>{`
        @keyframes window-fade {
          0% { opacity: 0; }
          10% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
