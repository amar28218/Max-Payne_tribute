"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { X, Eye, EyeOff, Lock } from "lucide-react"
import { useEscapeDismiss } from "@/components/noir/interactions"
import { triggerBulletTime } from "@/lib/bullet-time"
import { triggerFlashback } from "@/lib/flashback"

export interface Character {
  id: string
  name: string
  role: string
  description: string
  stats: { strength: number; intellect: number; will: number }
  quote: string
  alternateQuotes?: string[]
  evidence: Array<{
    title: string
    content: string
  }>
  connections: string[]
  redactedWords: string[]
}

interface DossierSystemProps {
  characters: Character[]
  onProgressChange?: (progress: number) => void
}

const STORAGE_KEY = "max-payne-tribute-discovered-lore"

// Stat descriptions
const STAT_DESCRIPTIONS: Record<string, Record<string, string>> = {
  max: {
    strength: "Years on the street and three years in a bottle. Both left marks.",
    intellect: "Ex-NYPD, ex-DEA. Trained to notice what gets people killed.",
    will: "Everything was taken from him once. He's still standing anyway.",
  },
  mona: {
    strength: "Doesn't need to overpower anyone. She's already three moves ahead.",
    intellect: "Reads a room, a rooftop, and a man's intentions in the same glance.",
    will: "Working an angle only she can see. Has been for years.",
  },
  horne: {
    strength: "Never lifts a finger. Never has to.",
    intellect: "Built a pharmaceutical empire on a drug that shouldn't exist.",
    will: "Doesn't flinch. Doesn't apologize. Doesn't stop.",
  },
  lupino: {
    strength: "Former enforcer muscle, now running on something worse than adrenaline.",
    intellect: "Paranoid, erratic, dangerous — but not stupid. Never stupid.",
    will: "Valkyr took whatever was left of his restraint a long time ago.",
  },
}

// Typewriter effect component
function TypewriterText({ text, isRevealed }: { text: string; isRevealed: boolean }) {
  const [displayText, setDisplayText] = useState("")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRevealed) {
      let i = 0
      setDisplayText("")
      intervalRef.current = setInterval(() => {
        if (i < text.length) {
          setDisplayText(text.slice(0, i + 1))
          i++
        } else {
          if (intervalRef.current) clearInterval(intervalRef.current)
        }
      }, 25)
    } else {
      setDisplayText("")
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRevealed, text])

  if (!isRevealed) {
    return <span className="text-muted-foreground">[ CLASSIFIED ]</span>
  }

  return <span>{displayText}<span className="animate-pulse">|</span></span>
}

// Redacted text component
function RedactedBio({ 
  text, 
  redactedWords, 
  isRedacted, 
  onWordReveal 
}: { 
  text: string
  redactedWords: string[]
  isRedacted: boolean
  onWordReveal: (word: string) => void
}) {
  const [revealedWords, setRevealedWords] = useState<Set<string>>(new Set())

  const handleWordClick = (word: string) => {
    if (!isRedacted && redactedWords.includes(word.toLowerCase())) {
      setRevealedWords(prev => new Set([...prev, word.toLowerCase()]))
      onWordReveal(word)
    }
  }

  const renderText = () => {
    const words = text.split(" ")
    return words.map((word, i) => {
      const cleanWord = word.toLowerCase().replace(/[.,!?]/g, "")
      const isRedactable = redactedWords.includes(cleanWord)
      const isCurrentlyRedacted = isRedacted && isRedactable && !revealedWords.has(cleanWord)
      
      return (
        <span key={i}>
          {isCurrentlyRedacted ? (
            <span 
              className="bg-foreground text-foreground cursor-pointer hover:bg-primary transition-colors px-1 select-none"
              onClick={() => handleWordClick(word)}
              data-clickable
            >
              {word}
            </span>
          ) : isRedactable && !isRedacted ? (
            <span className="text-primary font-bold">{word}</span>
          ) : (
            word
          )}
          {i < words.length - 1 ? " " : ""}
        </span>
      )
    })
  }

  return <>{renderText()}</>
}

// Connection node graph
function ConnectionsGraph({ 
  currentId, 
  connections, 
  characters, 
  onNodeClick 
}: { 
  currentId: string
  connections: string[]
  characters: Character[]
  onNodeClick: (id: string) => void
}) {
  const centerX = 100
  const centerY = 60
  const radius = 45

  return (
    <svg viewBox="0 0 200 120" className="w-full h-32">
      {/* Connection lines */}
      {connections.map((connId, i) => {
        const angle = (i / connections.length) * Math.PI * 2 - Math.PI / 2
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        return (
          <line
            key={connId}
            x1={centerX}
            y1={centerY}
            x2={x}
            y2={y}
            stroke="oklch(0.58 0.22 25)"
            strokeWidth="1"
            strokeDasharray="4,2"
            className="opacity-60"
          />
        )
      })}

      {/* Center node (current character) */}
      <circle cx={centerX} cy={centerY} r="12" fill="oklch(0.58 0.22 25)" />
      <text 
        x={centerX} 
        y={centerY + 4} 
        textAnchor="middle" 
        fill="white" 
        fontSize="8"
        fontFamily="monospace"
      >
        {currentId.slice(0, 2).toUpperCase()}
      </text>

      {/* Connected nodes */}
      {connections.map((connId, i) => {
        const angle = (i / connections.length) * Math.PI * 2 - Math.PI / 2
        const x = centerX + Math.cos(angle) * radius
        const y = centerY + Math.sin(angle) * radius
        const char = characters.find(c => c.id === connId)
        
        return (
          <g 
            key={connId} 
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onNodeClick(connId)}
            data-clickable
          >
            <circle cx={x} cy={y} r="10" fill="oklch(0.22 0 0)" stroke="oklch(0.58 0.22 25)" strokeWidth="1" />
            <text 
              x={x} 
              y={y + 3} 
              textAnchor="middle" 
              fill="white" 
              fontSize="7"
              fontFamily="monospace"
            >
              {char?.name.split(" ")[0].slice(0, 3).toUpperCase()}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// Stat bar with tooltip
function StatBar({
  label,
  value,
  description,
}: {
  label: string
  value: number
  description: string
}) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-xs text-muted-foreground uppercase">{label}</span>
        <span className="font-mono text-xs text-primary">{value}</span>
      </div>
      <div
        className="h-1.5 bg-muted overflow-hidden cursor-pointer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        data-clickable
      >
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute left-0 right-0 mt-2 p-2 bg-card border border-border text-xs font-serif text-muted-foreground z-10 animate-fade-in">
          {description}
        </div>
      )}
    </div>
  )
}

// Character card with suspect marking
function CharacterCard({
  character,
  isLocked,
  isSuspect,
  onOpen,
  onDoubleClick,
}: {
  character: Character
  isLocked: boolean
  isSuspect: boolean
  onOpen: () => void
  onDoubleClick: () => void
}) {
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onDoubleClick()
  }, [onDoubleClick])

  return (
    <button
      onClick={onOpen}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "w-full text-left p-6 border bg-card/50 hover:border-primary hover:bg-primary/10 transition-all duration-300 group relative overflow-hidden",
        isLocked ? "border-primary ring-1 ring-primary" : "border-border"
      )}
      data-clickable
    >
      {/* Suspect corner fold */}
      {isSuspect && (
        <>
          <div
            className="absolute top-0 right-0 w-12 h-12 bg-primary"
            style={{
              clipPath: "polygon(100% 0, 100% 100%, 0 0)",
            }}
          />
          <span
            className="absolute top-1 right-0 font-mono text-[8px] text-primary-foreground tracking-wider transform rotate-[35deg] origin-center"
            style={{ right: "-2px", top: "6px" }}
          >
            SUSPECT
          </span>
        </>
      )}

      <p className="font-sans text-2xl group-hover:text-primary transition-colors">
        {character.name}
      </p>
      <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mt-1">
        {character.role}
      </p>
      
      {isLocked && (
        <p className="font-mono text-[10px] text-primary mt-2">
          [PROFILE LOCKED]
        </p>
      )}
    </button>
  )
}

export function DetectiveDossier({ characters, onProgressChange }: DossierSystemProps) {
  const [activeDossier, setActiveDossier] = useState<string | null>(null)
  const [lockedProfiles, setLockedProfiles] = useState<Set<string>>(new Set())
  const [suspectMarks, setSuspectMarks] = useState<Set<string>>(new Set())
  const [quoteIndex, setQuoteIndex] = useState<Record<string, number>>({})
  const [discoveredLore, setDiscoveredLore] = useState<Set<string>>(new Set())
  const [revealedEvidence, setRevealedEvidence] = useState<Set<string>>(new Set())
  const [isRedacted, setIsRedacted] = useState(true)
  const [isClosing, setIsClosing] = useState(false)

  const activeCharacter = characters.find(c => c.id === activeDossier)
  const totalSecrets = characters.reduce((acc, c) => acc + c.evidence.length + c.redactedWords.length, 0)
  const progress = (discoveredLore.size / totalSecrets) * 100

  // Escape key dismissal
  useEscapeDismiss(() => closeDossier(), activeDossier !== null)

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setDiscoveredLore(new Set(parsed.discovered || []))
        setRevealedEvidence(new Set(parsed.evidence || []))
        setSuspectMarks(new Set(parsed.suspects || []))
      } catch {
        // Invalid data
      }
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      discovered: Array.from(discoveredLore),
      evidence: Array.from(revealedEvidence),
      suspects: Array.from(suspectMarks),
    }))
    onProgressChange?.(progress)
  }, [discoveredLore, revealedEvidence, suspectMarks, progress, onProgressChange])

  const openDossier = useCallback((id: string) => {
    setActiveDossier(id)
    setIsRedacted(true)
  }, [])

  const closeDossier = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      setActiveDossier(null)
      setIsClosing(false)
    }, 300)
  }, [])

  const toggleLock = useCallback((id: string) => {
    setLockedProfiles(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleSuspect = useCallback((id: string) => {
    setSuspectMarks(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const cycleQuote = useCallback((charId: string) => {
    const char = characters.find(c => c.id === charId)
    if (!char) return
    
    const quotes = [char.quote, ...(char.alternateQuotes || [])]
    if (quotes.length <= 1) return
    
    setQuoteIndex(prev => ({
      ...prev,
      [charId]: ((prev[charId] || 0) + 1) % quotes.length,
    }))
  }, [characters])

  const revealEvidence = useCallback((charId: string, evidenceIndex: number) => {
    const key = `${charId}-evidence-${evidenceIndex}`
    setRevealedEvidence(prev => new Set([...prev, key]))
    setDiscoveredLore(prev => new Set([...prev, key]))
    // Easter egg: Mona's rifle scope is the one piece of evidence in the
    // whole case file that's explicitly a weapon — reveal it, get bullet time.
    if (charId === "mona" && evidenceIndex === 0) {
      triggerBulletTime()
    }
  }, [])

  const handleWordReveal = useCallback((word: string) => {
    const key = `word-${word.toLowerCase()}`
    setDiscoveredLore(prev => new Set([...prev, key]))
    // Max's family are the two redacted words that matter most to him —
    // revealing either one triggers the flashback treatment.
    if (["michelle", "rose"].includes(word.toLowerCase())) {
      triggerFlashback()
    }
  }, [])

  const getCurrentQuote = (char: Character) => {
    const quotes = [char.quote, ...(char.alternateQuotes || [])]
    const index = quoteIndex[char.id] || 0
    return quotes[index]
  }

  return (
    <>
      {/* Progress HUD */}
      <div className="fixed top-6 left-6 z-50 flex items-center gap-3 bg-card/90 backdrop-blur-sm border border-border p-3">
        <Lock className="w-4 h-4 text-primary" />
        <div className="flex flex-col">
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
            Secrets Uncovered
          </span>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-24 h-1.5 bg-muted overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-mono text-xs text-primary">
              {discoveredLore.size}/{totalSecrets}
            </span>
          </div>
        </div>
      </div>

      {/* Character selector grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {characters.map(char => (
          <CharacterCard
            key={char.id}
            character={char}
            isLocked={lockedProfiles.has(char.id)}
            isSuspect={suspectMarks.has(char.id)}
            onOpen={() => openDossier(char.id)}
            onDoubleClick={() => toggleSuspect(char.id)}
          />
        ))}
      </div>

      {/* Dossier overlay */}
      {activeDossier && activeCharacter && (
        <div 
          className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8",
            isClosing ? "animate-out fade-out duration-300" : "animate-in fade-in duration-300"
          )}
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-background/95 backdrop-blur-sm"
            onClick={closeDossier}
          />

          {/* Dossier folder */}
          <div 
            className={cn(
              "relative w-full max-w-5xl max-h-[90vh] overflow-y-auto",
              "bg-[#1a1611] border-4 border-[#2a2520]",
              "shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]",
              isClosing ? "animate-out zoom-out-95 duration-300" : "animate-in zoom-in-95 duration-300"
            )}
            style={{
              filter: "sepia(0.15)",
            }}
          >
            {/* Paper texture noise overlay */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                background: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
              }}
            />

            {/* CLASSIFIED watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-30deg] pointer-events-none select-none">
              <span 
                className="font-sans text-[8rem] md:text-[12rem] text-primary/10 tracking-widest whitespace-nowrap"
                style={{ textShadow: "none" }}
              >
                CLASSIFIED
              </span>
            </div>

            {/* Close button */}
            <button
              onClick={closeDossier}
              className="absolute top-4 right-4 z-10 p-2 bg-card/80 border border-border hover:border-primary hover:text-primary transition-colors"
              data-clickable
            >
              <X className="w-5 h-5" />
            </button>

            {/* Dossier content */}
            <div className="relative z-[1] p-8 md:p-12">
              {/* Header */}
              <div className="flex flex-col md:flex-row gap-8 mb-12">
                {/* Polaroid photo */}
                <div className="flex-shrink-0">
                  <div 
                    className="w-48 h-56 bg-[#f5f0e8] p-3 shadow-lg rotate-[-2deg]"
                    style={{
                      clipPath: "polygon(2% 0%, 98% 1%, 100% 99%, 0% 98%)",
                    }}
                  >
                    <div className="w-full h-40 bg-gradient-to-br from-muted via-card to-background flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
                      <span className="font-sans text-8xl text-muted/30 select-none">
                        {activeCharacter.name.charAt(0)}
                      </span>
                    </div>
                    <p className="text-center font-mono text-xs text-muted-foreground mt-2 uppercase">
                      Subject {activeCharacter.id.toUpperCase()}
                    </p>
                  </div>
                  
                  {/* Red string decoration */}
                  <svg className="absolute top-24 left-56 w-32 h-32 hidden md:block" viewBox="0 0 100 100">
                    <path
                      d="M 0 50 Q 30 20 50 50 Q 70 80 100 50"
                      fill="none"
                      stroke="oklch(0.58 0.22 25)"
                      strokeWidth="1.5"
                      strokeDasharray="4,2"
                    />
                  </svg>
                </div>

                {/* Basic info */}
                <div className="flex-1">
                  <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-2">
                    Case File #{Math.floor(Math.random() * 9000) + 1000}
                  </p>
                  <h2 className="font-sans text-5xl md:text-6xl text-primary mb-2">
                    {activeCharacter.name}
                  </h2>
                  <p className="font-mono text-sm text-muted-foreground tracking-widest uppercase mb-6">
                    {activeCharacter.role}
                  </p>

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    {/* Redact toggle */}
                    <button
                      onClick={() => setIsRedacted(!isRedacted)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 border transition-all duration-300",
                        isRedacted 
                          ? "border-primary bg-primary/20 text-primary" 
                          : "border-border text-muted-foreground hover:border-primary"
                      )}
                      data-clickable
                    >
                      {isRedacted ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      <span className="font-mono text-xs uppercase tracking-widest">
                        {isRedacted ? "Unredact" : "Redact"}
                      </span>
                    </button>

                    {/* Lock profile */}
                    <button
                      onClick={() => toggleLock(activeCharacter.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 border transition-all duration-300",
                        lockedProfiles.has(activeCharacter.id)
                          ? "border-primary bg-primary/20 text-primary"
                          : "border-border text-muted-foreground hover:border-primary"
                      )}
                      data-clickable
                    >
                      <Lock className="w-4 h-4" />
                      <span className="font-mono text-xs uppercase tracking-widest">
                        {lockedProfiles.has(activeCharacter.id) ? "Unlock" : "Lock"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats with tooltips */}
              <div className="mb-12 p-6 bg-card/50 border border-border">
                <h3 className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-4">
                  Subject Assessment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatBar
                    label="Strength"
                    value={activeCharacter.stats.strength}
                    description={STAT_DESCRIPTIONS[activeCharacter.id]?.strength || "Physical capability assessment"}
                  />
                  <StatBar
                    label="Intellect"
                    value={activeCharacter.stats.intellect}
                    description={STAT_DESCRIPTIONS[activeCharacter.id]?.intellect || "Mental acuity rating"}
                  />
                  <StatBar
                    label="Will"
                    value={activeCharacter.stats.will}
                    description={STAT_DESCRIPTIONS[activeCharacter.id]?.will || "Psychological resilience factor"}
                  />
                </div>
              </div>

              {/* Description with redacted words */}
              <div className="mb-12 p-6 bg-card/50 border border-border">
                <h3 className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-4">
                  Subject Profile
                </h3>
                <p className="font-serif text-lg leading-relaxed text-foreground/90">
                  <RedactedBio 
                    text={activeCharacter.description}
                    redactedWords={activeCharacter.redactedWords}
                    isRedacted={isRedacted}
                    onWordReveal={handleWordReveal}
                  />
                </p>
              </div>

              {/* Evidence cards */}
              <div className="mb-12">
                <h3 className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-6">
                  Evidence Items
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {activeCharacter.evidence.map((item, i) => {
                    const key = `${activeCharacter.id}-evidence-${i}`
                    const isRevealed = revealedEvidence.has(key)
                    
                    return (
                      <button
                        key={i}
                        onClick={() => revealEvidence(activeCharacter.id, i)}
                        disabled={isRevealed}
                        className={cn(
                          "text-left p-6 border transition-all duration-300 min-h-[150px]",
                          isRevealed
                            ? "border-primary/50 bg-primary/5"
                            : "border-border bg-card/30 hover:border-primary cursor-pointer"
                        )}
                        data-clickable
                      >
                        <p className="font-mono text-xs text-primary tracking-widest uppercase mb-3">
                          Evidence #{i + 1}: {item.title}
                        </p>
                        <p className="font-serif text-sm text-muted-foreground leading-relaxed">
                          <TypewriterText text={item.content} isRevealed={isRevealed} />
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Connections web */}
              <div className="mb-12 p-6 bg-card/50 border border-border">
                <h3 className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-4">
                  Known Connections
                </h3>
                <ConnectionsGraph
                  currentId={activeCharacter.id}
                  connections={activeCharacter.connections}
                  characters={characters}
                  onNodeClick={openDossier}
                />
              </div>

              {/* Quote with cycling */}
              <blockquote 
                className="border-l-4 border-primary pl-6 py-2 cursor-pointer hover:bg-primary/5 transition-colors"
                onClick={() => cycleQuote(activeCharacter.id)}
                data-clickable
              >
                <p className="font-serif text-xl italic text-foreground">
                  {getCurrentQuote(activeCharacter)}
                </p>
                {(activeCharacter.alternateQuotes?.length || 0) > 0 && (
                  <p className="font-mono text-[10px] text-muted-foreground mt-2 uppercase">
                    Click to cycle quotes ({(quoteIndex[activeCharacter.id] || 0) + 1}/{1 + (activeCharacter.alternateQuotes?.length || 0)})
                  </p>
                )}
              </blockquote>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 200ms ease-out;
        }
      `}</style>
    </>
  )
}
