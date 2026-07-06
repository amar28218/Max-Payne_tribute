"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"

interface DialogueBeat {
  speaker: string
  text: string
  responses: {
    type: "truth" | "bluff" | "silent"
    text: string
    trustDelta: number
  }[]
}

const DIALOGUE_BEATS: DialogueBeat[] = [
  {
    speaker: "SUSPECT",
    text: "I already told the cops everything I know. Why should I trust you?",
    responses: [
      { type: "truth", text: "I'm not here to hurt you. I need your help.", trustDelta: 15 },
      { type: "bluff", text: "Because I know about the Aesir shipments.", trustDelta: -10 },
      { type: "silent", text: "...", trustDelta: 5 },
    ],
  },
  {
    speaker: "SUSPECT",
    text: "Horne's people have eyes everywhere. If they find out I talked...",
    responses: [
      { type: "truth", text: "I can protect you. I've done it before.", trustDelta: 10 },
      { type: "bluff", text: "Horne's already marked you. I'm your only way out.", trustDelta: -15 },
      { type: "silent", text: "...", trustDelta: 8 },
    ],
  },
  {
    speaker: "SUSPECT",
    text: "What's in it for me? I've got a family to think about.",
    responses: [
      { type: "truth", text: "Justice. For everyone Valkyr has hurt.", trustDelta: 20 },
      { type: "bluff", text: "Money. Enough to disappear forever.", trustDelta: -5 },
      { type: "silent", text: "...", trustDelta: 3 },
    ],
  },
  {
    speaker: "SUSPECT",
    text: "You don't understand. The things I've seen... the things they made me do...",
    responses: [
      { type: "truth", text: "I know what guilt feels like. This is your chance at redemption.", trustDelta: 25 },
      { type: "bluff", text: "The DA has your prints on the manifest.", trustDelta: -20 },
      { type: "silent", text: "...", trustDelta: 10 },
    ],
  },
  {
    speaker: "SUSPECT",
    text: "Fine. One last question. Why do you really care about bringing Aesir down?",
    responses: [
      { type: "truth", text: "That drug came from her labs. It's personal.", trustDelta: 30 },
      { type: "bluff", text: "I don't. I just want what's in her vault.", trustDelta: -25 },
      { type: "silent", text: "...", trustDelta: 15 },
    ],
  },
]

// Typewriter text component
function TypewriterDialogue({ 
  text, 
  speed = 35, 
  onComplete 
}: { 
  text: string
  speed?: number
  onComplete?: () => void 
}) {
  const [displayText, setDisplayText] = useState("")
  const [isComplete, setIsComplete] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    let i = 0
    setDisplayText("")
    setIsComplete(false)

    intervalRef.current = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.slice(0, i + 1))
        i++
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setIsComplete(true)
        onComplete?.()
      }
    }, speed)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [text, speed, onComplete])

  return (
    <span>
      {displayText}
      {!isComplete && <span className="animate-pulse text-primary">|</span>}
    </span>
  )
}

// Stress meter component
function StressMeter({ value }: { value: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
        Stress
      </span>
      <div className="w-32 h-4 bg-card border border-border relative overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 bg-primary transition-all duration-500"
          style={{ 
            width: `${value}%`,
            animation: value > 50 ? "jitter 0.1s infinite" : "none",
            boxShadow: value > 70 ? "0 0 10px oklch(0.58 0.22 25), 0 0 20px oklch(0.58 0.22 25)" : "none",
          }}
        />
        {/* Jitter overlay */}
        {value > 50 && (
          <div className="absolute inset-0 bg-primary/30 animate-pulse" />
        )}
      </div>
    </div>
  )
}

interface InterrogationMinigameProps {
  onComplete: (success: boolean, unlockedLore: string | null) => void
}

export function InterrogationMinigame({ onComplete }: InterrogationMinigameProps) {
  const [currentBeat, setCurrentBeat] = useState(0)
  const [trustScore, setTrustScore] = useState(50)
  const [stressLevel, setStressLevel] = useState(0)
  const [dialogueReady, setDialogueReady] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [outcome, setOutcome] = useState<"success" | "failure" | null>(null)
  const [screenShake, setScreenShake] = useState(false)
  const [screenPulse, setScreenPulse] = useState(false)

  const beat = DIALOGUE_BEATS[currentBeat]
  const isLastBeat = currentBeat === DIALOGUE_BEATS.length - 1

  // Screen pulse effect
  const triggerPulse = useCallback(() => {
    setScreenPulse(true)
    setTimeout(() => setScreenPulse(false), 150)
  }, [])

  // Screen shake effect
  const triggerShake = useCallback(() => {
    setScreenShake(true)
    setTimeout(() => setScreenShake(false), 500)
  }, [])

  // Handle response selection
  const handleResponse = useCallback((response: typeof beat.responses[number]) => {
    if (isTransitioning || !dialogueReady) return

    triggerPulse()
    setIsTransitioning(true)
    setDialogueReady(false)

    // Update scores
    const newTrust = Math.max(0, Math.min(100, trustScore + response.trustDelta))
    setTrustScore(newTrust)

    // Bluffing increases stress
    if (response.type === "bluff") {
      setStressLevel(prev => Math.min(100, prev + 20))
    }

    setTimeout(() => {
      if (isLastBeat) {
        // Determine outcome
        const success = newTrust >= 60
        setOutcome(success ? "success" : "failure")
        
        if (!success) {
          triggerShake()
        }

        setTimeout(() => {
          onComplete(success, success ? "The suspect revealed Aesir's shipment manifest." : null)
        }, 3000)
      } else {
        setCurrentBeat(prev => prev + 1)
        setIsTransitioning(false)
      }
    }, 1000)
  }, [isTransitioning, dialogueReady, trustScore, isLastBeat, onComplete, triggerPulse, triggerShake])

  const getButtonLabel = (type: "truth" | "bluff" | "silent") => {
    switch (type) {
      case "truth": return "TRUTH PRESSURE"
      case "bluff": return "BLUFF"
      case "silent": return "STAY SILENT"
    }
  }

  const getButtonStyle = (type: "truth" | "bluff" | "silent") => {
    switch (type) {
      case "truth": return "border-green-700/50 hover:border-green-600 hover:bg-green-950/30"
      case "bluff": return "border-primary/50 hover:border-primary hover:bg-primary/10"
      case "silent": return "border-border hover:border-muted-foreground hover:bg-muted/20"
    }
  }

  if (outcome) {
    return (
      <section className={cn(
        "relative py-32 px-6 bg-background min-h-screen flex items-center justify-center",
        screenShake && "animate-shake"
      )}>
        {/* Spotlight effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05)_0%,transparent_50%)]" />
        
        <div className={cn(
          "text-center transition-all duration-1000",
          outcome === "success" ? "opacity-100" : "opacity-100"
        )}>
          <h2 className={cn(
            "font-sans text-6xl md:text-8xl mb-6",
            outcome === "success" ? "text-green-500" : "text-primary"
          )}>
            {outcome === "success" ? "HE TALKED" : "HE CLAMMED UP"}
          </h2>
          <p className="font-serif text-xl text-muted-foreground italic max-w-xl mx-auto">
            {outcome === "success" 
              ? "\"Alright, alright... I'll tell you where the Aesir shipment drops. But you didn't hear it from me.\""
              : "\"We're done here. I've got nothing more to say to you. Get out.\""}
          </p>
          
          {/* Bad cop animation - table slam */}
          {outcome === "failure" && (
            <div className="mt-12 flex justify-center">
              <div className="w-64 h-2 bg-border animate-slam origin-bottom" />
            </div>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className={cn(
      "relative py-32 px-6 bg-background min-h-[80vh] flex flex-col items-center justify-center overflow-hidden",
      screenShake && "animate-shake",
      screenPulse && "animate-pulse-once"
    )}>
      {/* Spotlight from above */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(255,255,255,0.08)_0%,transparent_40%)]" />
      
      {/* Silhouette figure */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-10">
        <svg viewBox="0 0 200 300" className="w-32 h-48">
          <ellipse cx="100" cy="60" rx="35" ry="40" fill="currentColor" />
          <path d="M 60 100 Q 60 180 80 250 L 120 250 Q 140 180 140 100 Z" fill="currentColor" />
        </svg>
      </div>

      {/* Table */}
      <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-96 h-4 bg-muted/30 rounded-sm" />

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto w-full">
        {/* Section title */}
        <div className="text-center mb-12">
          <p className="font-mono text-primary text-sm tracking-[0.3em] mb-4 uppercase">
            Interrogation Room
          </p>
          <h2 className="font-sans text-4xl md:text-6xl tracking-tight">THE INTERVIEW</h2>
        </div>

        {/* Stats bar */}
        <div className="flex items-center justify-between mb-12 px-4">
          {/* Trust meter */}
          <div className="flex flex-col items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
              Trust
            </span>
            <div className="w-32 h-4 bg-card border border-border relative overflow-hidden">
              <div 
                className={cn(
                  "absolute inset-y-0 left-0 transition-all duration-500",
                  trustScore >= 60 ? "bg-green-600" : trustScore >= 40 ? "bg-yellow-600" : "bg-primary"
                )}
                style={{ width: `${trustScore}%` }}
              />
            </div>
            <span className="font-mono text-xs text-muted-foreground">{trustScore}%</span>
          </div>

          {/* Round indicator */}
          <div className="flex flex-col items-center">
            <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
              Round
            </span>
            <span className="font-sans text-2xl text-primary">
              {currentBeat + 1}/{DIALOGUE_BEATS.length}
            </span>
          </div>

          {/* Stress meter */}
          <StressMeter value={stressLevel} />
        </div>

        {/* Dialogue box */}
        <div className="comic-panel bg-card/80 p-8 mb-8">
          <p className="font-mono text-xs text-primary tracking-widest uppercase mb-4">
            {beat.speaker}
          </p>
          <p className="font-serif text-xl md:text-2xl text-foreground leading-relaxed min-h-[80px]">
            {!isTransitioning && (
              <TypewriterDialogue 
                key={currentBeat}
                text={beat.text} 
                onComplete={() => setDialogueReady(true)} 
              />
            )}
          </p>
        </div>

        {/* Response options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {beat.responses.map((response) => (
            <button
              key={response.type}
              onClick={() => handleResponse(response)}
              disabled={!dialogueReady || isTransitioning}
              className={cn(
                "p-6 border transition-all duration-300 text-left",
                getButtonStyle(response.type),
                !dialogueReady && "opacity-50 cursor-not-allowed",
                dialogueReady && "cursor-pointer"
              )}
            >
              <p className="font-mono text-xs tracking-widest uppercase mb-2 text-muted-foreground">
                {getButtonLabel(response.type)}
              </p>
              <p className="font-serif text-sm text-foreground italic">
                {response.text}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none noir-vignette" />
    </section>
  )
}
