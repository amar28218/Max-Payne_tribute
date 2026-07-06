"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { StoryBeatTrigger } from "@/components/noir/story-beat-trigger"
import { DistrictAnchor } from "@/components/noir/district-anchor"
import { DistrictRail } from "@/components/noir/district-rail"
import { BulletTimeOverlay } from "@/components/noir/bullet-time-overlay"
import { FlashbackOverlay } from "@/components/noir/flashback-overlay"
import { triggerBulletTime } from "@/lib/bullet-time"
import { BootSequence } from "@/components/noir/boot-sequence"
import { NoirCursor } from "@/components/noir/cursor-system"
import { TiltCard } from "@/components/noir/tilt-card"
import { GlitchText } from "@/components/noir/glitch-text"
import { CinematicTransition, useTransition, type TransitionType } from "@/components/noir/cinematic-transition"
import { DetectiveDossier, type Character } from "@/components/noir/dossier-system"
import { ParallaxSystem, OptimizedFilmGrain } from "@/components/noir/parallax-system"
import { ProceduralAudio } from "@/components/noir/procedural-audio"
import { InterrogationMinigame } from "@/components/noir/interrogation-minigame"
import { useScrollProgress, useIsMobile, useTouchGestures } from "@/components/noir/performance-hooks"
import {
  InteractiveTitle,
  InteractiveScrollIndicator,
  InteractiveChapterCard,
  InteractiveQuote,
  InteractiveSceneButton,
  InteractiveSkyline,
  InteractiveHeading,
  useReadParagraphs,
  useEscapeDismiss,
} from "@/components/noir/interactions"

// Character data for dossier system
// NOTE: names and locations are drawn from Max Payne (2001). All quotes and
// evidence text below are original writing for this tribute — not lines
// from the game's script.
const CHARACTERS: Character[] = [
  {
    id: "max",
    name: "MAX PAYNE",
    role: "The Vigilante",
    description: "Former NYPD, later undercover DEA. His wife and infant daughter were murdered in their apartment while he was still on the force. Three years later, framed for a killing he didn't commit, he went underground — and started pulling on the thread that led to Aesir.",
    stats: { strength: 80, intellect: 85, will: 96 },
    quote: "\"I stopped believing in happy endings a long time ago. I just wanted the ending to mean something.\"",
    evidence: [
      { title: "Badge", content: "NYPD badge, surrendered years ago. Kept anyway. Some habits don't break clean." },
      { title: "Photograph", content: "A photo of Michelle and Rose, creased from being folded and unfolded too many times." },
      { title: "Case Notes", content: "Handwritten notes on a drug called Valkyr, and a company called Aesir that shouldn't have a reason to know his name." },
    ],
    connections: ["mona", "horne", "lupino"],
    redactedWords: ["michelle", "rose", "valkyr"],
  },
  {
    id: "mona",
    name: "MONA SAX",
    role: "The Contract Killer",
    description: "A sniper with no fixed employer and no fixed loyalty — except, maybe, to her sister's memory. Lisa died in circumstances that trace back to the same people Max is hunting. Mona keeps showing up at the worst possible moments, always with a rifle and never with a clear answer about whose side she's on.",
    stats: { strength: 58, intellect: 82, will: 90 },
    quote: "\"You keep assuming I'm here to save you. I'm here for my own reasons. Yours just happen to overlap.\"",
    evidence: [
      { title: "Rifle Scope", content: "A cracked scope lens. Whatever she was watching through it, it clearly didn't go to plan." },
      { title: "Photograph", content: "Two sisters, younger, on a rooftop somewhere. Only one of them is still alive to remember it." },
      { title: "Note", content: "Unsigned, in careful handwriting: \"Don't trust Aesir. Don't trust anyone who works for them either.\"" },
    ],
    connections: ["max", "lupino"],
    redactedWords: ["lisa", "rooftop", "sister"],
  },
  {
    id: "horne",
    name: "NICOLE HORNE",
    role: "The Kingpin",
    description: "CEO of Aesir Corporation. Publicly, a pharmaceutical executive. Privately, the architect of Valkyr — a drug that made it onto the street and into a lot of very bad decisions, including, indirectly, the night Max's family died. She has never once raised her voice about any of it.",
    stats: { strength: 30, intellect: 98, will: 99 },
    quote: "\"I don't deal in guilt. Guilt is for people who didn't think far enough ahead.\"",
    evidence: [
      { title: "Internal Memo", content: "\"Field testing of Compound V is proceeding ahead of schedule. Containment of the distribution leak is priority one.\"" },
      { title: "Shipping Manifest", content: "Aesir Corporation crates, routed through three shell companies before reaching Ragna Rock." },
      { title: "Photograph", content: "Horne at a product launch, smiling for the press. Taken the same week the leak reached the street." },
    ],
    connections: ["lupino", "max"],
    redactedWords: ["aesir", "valkyr", "compound"],
  },
  {
    id: "lupino",
    name: "JACK LUPINO",
    role: "The Enforcer",
    description: "Runs Ragna Rock and whatever's left of the old mob muscle that hasn't been absorbed by Aesir's money. Deep into his own supply of Valkyr, which has made him unpredictable even by the standards of men who solve problems with guns. Nobody's sure anymore whether he's protecting Horne's operation or just barely holding himself together.",
    stats: { strength: 95, intellect: 42, will: 55 },
    quote: "\"You want to talk business? Fine. Talk fast. The walls have started talking back to me.\"",
    evidence: [
      { title: "Club Ledger", content: "Ragna Rock's books, half legitimate. The other half is written in a code nobody's cracked yet." },
      { title: "Prescription Bottle", content: "No label. No pharmacy stamp. Empty." },
      { title: "Torn Note", content: "\"They're not made anymore, they're just angels\" — scrawled over and over on the same page." },
    ],
    connections: ["horne", "max", "mona"],
    redactedWords: ["ragna", "valkyr", "angels"],
  },
]

// Ordered districts for the rail nav — must match the order <DistrictAnchor> markers appear down the page
const DISTRICTS = ["ROSCOE STREET", "SUBWAY", "RAGNA ROCK", "PUNCHINELLO'S MANSION", "THE FINAL NIGHT"]

// Hero section with interactive elements
function HeroSection() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(true)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center noir-vignette overflow-hidden">
      {/* Background with heavy shadows */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-card" />

      {/* Interactive skyline for building clicks */}
      <InteractiveSkyline className="z-10" />

      {/* Main content */}
      <div className={cn(
        "relative z-20 text-center px-6 max-w-5xl mx-auto transition-all duration-1000",
        loaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      )}>
        {/* Subtitle */}
        <p className="font-mono text-primary text-sm md:text-base tracking-[0.3em] mb-4 uppercase">
          An Unofficial Fan Tribute
        </p>
        
        {/* Main title with interactive letters */}
        <h1 className="font-sans text-7xl md:text-9xl lg:text-[12rem] leading-none tracking-tight text-shadow-noir mb-6">
          <InteractiveTitle text="MAX" className="block" />
          <span className="block text-primary">
            <InteractiveTitle text="PAYNE" />
          </span>
        </h1>
        
        {/* Tagline */}
        <p className="font-serif text-xl md:text-2xl text-muted-foreground italic max-w-2xl mx-auto mb-12">
          {"\"New York, 1998. The rain doesn't stop for anyone's grief. It just makes the walk longer.\""}
        </p>

        {/* CTA */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button 
            className="group relative inline-flex items-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg tracking-widest transition-all duration-300 hover:shadow-[0_0_30px_rgba(220,38,38,0.4)]"
            data-clickable
          >
            <span>ENTER THE CITY</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </button>
          <button
            onClick={() => triggerBulletTime()}
            className="inline-flex items-center gap-2 border border-border hover:border-primary text-muted-foreground hover:text-primary px-6 py-4 text-sm tracking-[0.2em] uppercase transition-all duration-300"
            data-clickable
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary/70" />
            Slow Time
          </button>
        </div>
      </div>

      {/* Interactive scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <InteractiveScrollIndicator targetId="story-section" tooltip="Enter the city" />
      </div>
    </section>
  )
}

// Story timeline with interactive chapter cards
function StoryTimeline({ isMobile }: { isMobile: boolean }) {
  const [visiblePanels, setVisiblePanels] = useState<number[]>([])
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const panels = [
    {
      chapter: "01",
      title: "ROSCOE STREET",
      description: "The night everything came apart started at a subway station he'd walked through a hundred times before.",
      extendedContent: "Snow turning to rain over a station he knew better than his own apartment. What should have been a routine favor for an old friend became the first domino in a night that wouldn't end for three years.",
      year: "1998",
      tags: ["origin", "tragedy"],
    },
    {
      chapter: "02",
      title: "THE SUBWAY",
      description: "Underground, off the books, and already bleeding. The tunnels don't care who you used to be.",
      extendedContent: "Every station down was a step further from anything resembling backup. Whatever Aesir had shipped through this line, it had already reached the platforms — and the people on them.",
      year: "1998",
      tags: ["descent", "action"],
    },
    {
      chapter: "03",
      title: "RAGNA ROCK",
      description: "A nightclub that runs on two currencies: cash, and a drug called Valkyr.",
      extendedContent: "Lupino's club, loud enough to swallow gunfire whole. Somewhere behind the bar was a name that connected a dead informant, a missing shipment, and a company that made pharmaceuticals for a living — officially.",
      year: "1998",
      tags: ["mystery", "action"],
    },
    {
      chapter: "04",
      title: "PUNCHINELLO'S MANSION",
      description: "Old money, old family, and a new problem it can't shoot its way out of.",
      extendedContent: "The mob had survived worse than one angry ex-cop before. What it hadn't survived was Aesir deciding the old families were no longer useful — and Max walking in right as that decision was being made.",
      year: "1998",
      tags: ["climax", "revenge"],
    },
    {
      chapter: "05",
      title: "THE FINAL NIGHT",
      description: "Every thread leads to the same place. Every question gets the same answer: Nicole Horne.",
      extendedContent: "No more middlemen, no more enforcers standing between him and the top of the chain. Just a corporation that built a drug it couldn't control, and a man with nothing left to lose finding out exactly how far up it went.",
      year: "1998",
      tags: ["finale", "revenge"],
    },
  ]

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"))
            setVisiblePanels((prev) => [...new Set([...prev, index])])
          }
        })
      },
      { threshold: 0.3 }
    )

    document.querySelectorAll("[data-panel]").forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  const handleTagClick = useCallback((tag: string) => {
    setActiveTag(prev => prev === tag ? null : tag)
  }, [])

  const PanelWrapper = isMobile ? "div" : TiltCard

  return (
    <section id="story-section" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section title */}
        <div className="text-center mb-20">
          <p className="font-mono text-primary text-sm tracking-[0.3em] mb-4 uppercase">The Story</p>
          <InteractiveHeading as="h2" className="font-sans text-5xl md:text-7xl tracking-tight">
            FIVE ACTS
          </InteractiveHeading>
          <p className="font-serif text-muted-foreground italic mt-4">{"One bad night, stretched out over three years, and one very long walk back."}</p>
          
          {/* Active filter indicator */}
          {activeTag && (
            <p className="font-mono text-xs text-primary mt-4">
              Filtering: {activeTag.toUpperCase()} 
              <button 
                onClick={() => setActiveTag(null)} 
                className="ml-2 text-muted-foreground hover:text-primary"
                data-clickable
              >
                [clear]
              </button>
            </p>
          )}
        </div>

        {/* Comic panels grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {panels.map((panel, index) => (
            <PanelWrapper
              key={panel.chapter}
              className={cn(
                "transition-all duration-700",
                visiblePanels.includes(index)
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-10",
                index % 2 === 1 && "md:translate-y-12"
              )}
            >
              <div
                data-panel
                data-index={index}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <InteractiveChapterCard
                  chapter={panel.chapter}
                  title={panel.title}
                  description={panel.description}
                  extendedContent={panel.extendedContent}
                  year={panel.year}
                  tags={panel.tags}
                  isFiltered={activeTag !== null && !panel.tags.includes(activeTag)}
                  onTagClick={handleTagClick}
                >
                  <GlitchText text={panel.title} />
                </InteractiveChapterCard>
                {/* Sync a real thunder strike to the two darkest turns in the story */}
                {(panel.chapter === "03" || panel.chapter === "05") && (
                  <StoryBeatTrigger intensity="close" />
                )}
                {/* The climax gets the signature bullet-time moment */}
                {panel.chapter === "05" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      triggerBulletTime()
                    }}
                    className="mt-3 inline-flex items-center gap-2 font-mono text-xs tracking-[0.2em] uppercase text-primary/80 hover:text-primary border-b border-primary/30 hover:border-primary pb-0.5 transition-colors"
                    data-clickable
                  >
                    ● Relive the moment
                  </button>
                )}
              </div>
            </PanelWrapper>
          ))}
        </div>
      </div>
    </section>
  )
}

// Character profiles section
function CharacterProfiles({ onHoverChange }: { onHoverChange: (hovering: boolean) => void }) {
  return (
    <section 
      className="relative py-32 px-6 bg-gradient-to-b from-background via-card/50 to-background"
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section title */}
        <div className="text-center mb-20">
          <p className="font-mono text-primary text-sm tracking-[0.3em] mb-4 uppercase">The Cast</p>
          <InteractiveHeading as="h2" className="font-sans text-5xl md:text-7xl tracking-tight">
            THE CASE FILE
          </InteractiveHeading>
          <p className="font-serif text-muted-foreground italic mt-4">
            {"Click a profile to access their classified dossier."}
          </p>
        </div>

        <DetectiveDossier characters={CHARACTERS} />
      </div>
    </section>
  )
}

// Interactive scene transition
function SceneTransitionSection({ isMobile }: { isMobile: boolean }) {
  const [activeScene, setActiveScene] = useState(0)
  const [visitedScenes, setVisitedScenes] = useState<Set<number>>(new Set([0]))
  const [defaultScene, setDefaultScene] = useState(0)
  const { activeTransition, triggerTransition, handleComplete } = useTransition()

  const scenes: Array<{
    id: number
    name: string
    description: string
    atmosphere: string
    hoverDescription: string
    transitionType: TransitionType
    transitionLabel: string
  }> = [
    {
      id: 1,
      name: "ROSCOE STREET STATION",
      description: "Where it all fell apart. Where it will all come back to eventually.",
      atmosphere: "Fluorescent-lit. Snow turning to rain. No way out but through.",
      hoverDescription: "Subway station, downtown — the beginning of a very long night",
      transitionType: "iris",
      transitionLabel: "Flashback",
    },
    {
      id: 2,
      name: "RAGNA ROCK CLUB",
      description: "Lupino's club. Cash on one side of the bar, Valkyr on the other.",
      atmosphere: "Smoke-filled. Bass-heavy. One wrong word from a bloodbath.",
      hoverDescription: "Nightclub, run by Jack Lupino — Valkyr distribution point",
      transitionType: "blinds",
      transitionLabel: "Location",
    },
    {
      id: 3,
      name: "AESIR CORPORATION",
      description: "Clean carpets, quiet elevators, and a drug problem built three floors up.",
      atmosphere: "Cold. Clinical. Every surface polished except the truth.",
      hoverDescription: "Nicole Horne's corporate tower — the real source",
      transitionType: "smash",
      transitionLabel: "Reveal",
    },
    {
      id: 4,
      name: "PUNCHINELLO'S MANSION",
      description: "Old family money trying to survive a war it didn't start.",
      atmosphere: "Marble halls. Loaded guns. A family running out of time.",
      hoverDescription: "The Punchinello estate — the old guard's last stand",
      transitionType: "burn",
      transitionLabel: "Time Skip",
    },
  ]

  const handleSceneChange = useCallback((index: number) => {
    if (index === activeScene || activeTransition) return
    
    triggerTransition(scenes[index].transitionType, () => {
      setActiveScene(index)
      setVisitedScenes(prev => new Set([...prev, index]))
    })
  }, [activeScene, activeTransition, triggerTransition, scenes])

  // Touch gestures for mobile
  useTouchGestures(
    () => handleSceneChange(Math.min(scenes.length - 1, activeScene + 1)),
    () => handleSceneChange(Math.max(0, activeScene - 1))
  )

  return (
    <section className="relative py-32 px-6">
      {/* Cinematic transition overlay */}
      {activeTransition && (
        <CinematicTransition
          type={activeTransition.type}
          isActive={true}
          onComplete={handleComplete}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Section title */}
        <div className="text-center mb-20">
          <p className="font-mono text-primary text-sm tracking-[0.3em] mb-4 uppercase">Locations</p>
          <InteractiveHeading as="h2" className="font-sans text-5xl md:text-7xl tracking-tight">
            SCENES OF THE CRIME
          </InteractiveHeading>
          {isMobile && (
            <p className="font-mono text-xs text-muted-foreground mt-4">Swipe to change scenes</p>
          )}
        </div>

        {/* Scene display */}
        <div className={cn(
          "relative aspect-[21/9] comic-panel bg-card overflow-hidden mb-8 transition-[filter] duration-700",
          activeScene === 0 && "flashback-frame"
        )}>
          {/* Scene background */}
          <div className={cn(
            "absolute inset-0 transition-opacity duration-500",
            activeTransition ? "opacity-0" : "opacity-100"
          )}>
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent z-10" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background z-10" />
            
            {/* Dynamic background based on scene */}
            <div className={cn(
              "absolute inset-0 transition-all duration-700",
              activeScene === 0 && "bg-gradient-to-br from-muted via-card to-background",
              activeScene === 1 && "bg-gradient-to-br from-primary/20 via-card to-background",
              activeScene === 2 && "bg-gradient-to-br from-muted/50 via-secondary to-background",
              activeScene === 3 && "bg-gradient-to-br from-blue-950/30 via-card to-background"
            )} />
          </div>

          {/* Scene content */}
          <div className={cn(
            "relative z-20 h-full flex flex-col justify-end p-8 md:p-12 transition-all duration-500",
            activeTransition ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
          )}>
            <p className="font-mono text-primary text-sm tracking-[0.3em] mb-2 uppercase">
              Scene {scenes[activeScene].id}
              {defaultScene === activeScene && (
                <span className="ml-2 text-muted-foreground">[default]</span>
              )}
            </p>
            <h3 className="font-sans text-4xl md:text-6xl mb-4">
              <GlitchText text={scenes[activeScene].name} />
            </h3>
            <p className="font-serif text-xl text-muted-foreground italic max-w-xl">
              {scenes[activeScene].description}
            </p>
            <p className="font-mono text-xs text-muted-foreground/60 tracking-widest uppercase mt-4">
              {scenes[activeScene].atmosphere}
            </p>
          </div>

          {/* Extra scanline texture while the flashback scene is active */}
          {activeScene === 0 && (
            <div className="absolute inset-0 z-30 pointer-events-none vhs-scanlines opacity-60" />
          )}
        </div>

        {/* Scene selector with context menus */}
        <div className="flex flex-wrap justify-center gap-4">
          {scenes.map((scene, index) => (
            <InteractiveSceneButton
              key={scene.id}
              scene={scene}
              isActive={activeScene === index}
              isVisited={visitedScenes.has(index)}
              description={scene.hoverDescription}
              disabled={!!activeTransition}
              onClick={() => handleSceneChange(index)}
              onSetDefault={() => setDefaultScene(index)}
              onMarkVisited={() => setVisitedScenes(prev => new Set([...prev, index]))}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// Interrogation wrapper
function InterrogationSection({ onComplete }: { onComplete: (success: boolean, lore: string | null) => void }) {
  const [completed, setCompleted] = useState(false)
  const [result, setResult] = useState<{ success: boolean; lore: string | null } | null>(null)

  const handleComplete = useCallback((success: boolean, lore: string | null) => {
    setResult({ success, lore })
    setCompleted(true)
    onComplete(success, lore)
  }, [onComplete])

  if (completed && result) {
    return (
      <section className="relative py-32 px-6 bg-card/50">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-mono text-primary text-sm tracking-[0.3em] mb-4 uppercase">
            Interrogation Complete
          </p>
          <h2 className={cn(
            "font-sans text-4xl md:text-6xl mb-6",
            result.success ? "text-green-500" : "text-primary"
          )}>
            {result.success ? "INTEL ACQUIRED" : "DEAD END"}
          </h2>
          {result.lore && (
            <p className="font-serif text-lg text-muted-foreground italic">
              New evidence unlocked: {result.lore}
            </p>
          )}
        </div>
      </section>
    )
  }

  return <InterrogationMinigame onComplete={handleComplete} />
}

// Footer
function Footer() {
  return (
    <footer className="relative py-20 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Logo */}
          <div>
            <h3 className="font-sans text-4xl mb-4">
              <InteractiveTitle text="MAX" />
              <span className="text-primary"><InteractiveTitle text="PAYNE" /></span>
            </h3>
            <p className="font-serif text-muted-foreground italic">
              A tribute, not a copy.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-4">
              Navigate
            </h4>
            <nav className="space-y-2">
              {["Story", "Characters", "Locations", "Gallery"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="block font-sans text-lg text-foreground hover:text-primary transition-colors"
                  data-clickable
                >
                  {item}
                </a>
              ))}
            </nav>
          </div>

          {/* Credits */}
          <div>
            <h4 className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-4">
              Credits
            </h4>
            <p className="font-mono text-sm text-muted-foreground">
              An unofficial fan project
              <br />
              Built by an admirer of the original
              <br />
              <span className="text-primary">Not for sale, not for profit</span>
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="font-mono text-[11px] leading-relaxed text-muted-foreground/70 max-w-3xl">
            This is an unofficial, non-commercial fan tribute inspired by Max Payne (2001).
            It is not affiliated with, endorsed by, or sponsored by Remedy Entertainment,
            Rockstar Games, or Take-Two Interactive. Max Payne and all related characters,
            names, and marks are trademarks of their respective owners. All narration,
            dialogue, and evidence text on this site is original writing created for this
            tribute, not reproduced from the game.
          </p>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-mono text-xs text-muted-foreground tracking-widest">
            NEW YORK, 1998 — SOME NIGHTS DON'T END WHEN THE SUN COMES UP
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            Built with rain and determination
          </p>
        </div>
      </div>
    </footer>
  )
}

// Main page component
export default function NoirCityPage() {
  const [performanceMode, setPerformanceMode] = useState(false)
  const [isHoveringCharacter, setIsHoveringCharacter] = useState(false)
  const [bootComplete, setBootComplete] = useState(false)
  const scrollProgress = useScrollProgress()
  const isMobile = useIsMobile()

  // Auto-enable performance mode on mobile
  useEffect(() => {
    if (isMobile) {
      setPerformanceMode(true)
    }
  }, [isMobile])

  // Lock scroll while the boot sequence is playing
  useEffect(() => {
    document.body.style.overflow = bootComplete ? "" : "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [bootComplete])

  const handleInterrogationComplete = useCallback((success: boolean, lore: string | null) => {
    // Could save to global state or localStorage
    console.log("Interrogation result:", { success, lore })
  }, [])

  return (
    <main className="relative min-h-screen bg-background text-foreground">
      <BootSequence onComplete={() => setBootComplete(true)} />
      <BulletTimeOverlay />
      <FlashbackOverlay />

      {/* Custom cursor system - disabled on mobile */}
      {!isMobile && <NoirCursor />}

      {/* District rail nav - desktop only */}
      <DistrictRail districts={DISTRICTS} scrollProgress={scrollProgress} />
      
      {/* Multi-layer parallax with rain and lightning — storm escalates with scroll progress */}
      <ParallaxSystem performanceMode={performanceMode} stormIntensity={scrollProgress} />
      
      {/* Optimized film grain */}
      <OptimizedFilmGrain performanceMode={performanceMode} />
      
      {/* Procedural audio system */}
      <ProceduralAudio 
        scrollProgress={scrollProgress}
        isHoveringCharacter={isHoveringCharacter}
        performanceMode={performanceMode}
        onPerformanceModeToggle={() => setPerformanceMode(!performanceMode)}
      />

      {/* Page sections */}
      <HeroSection />

      <DistrictAnchor district="ROSCOE STREET" />

      {/* First storm beat — distant, just atmosphere, right as the story proper begins */}
      <StoryBeatTrigger intensity="distant" />
      
      <InteractiveQuote 
        quote="The rain in this city doesn't wash anything clean. It just makes the blood easier to miss."
        author="Max Payne"
      />

      <DistrictAnchor district="SUBWAY" />
      
      <StoryTimeline isMobile={isMobile} />
      
      <InteractiveQuote 
        quote="Everybody in this story thinks they're the one telling it. Most of them are wrong."
        author="The Narrator"
      />

      <DistrictAnchor district="RAGNA ROCK" />

      {/* Close strike — the interrogation room is where the night turns */}
      <StoryBeatTrigger intensity="close" />

      {/* Interrogation minigame between story chapters */}
      <InterrogationSection onComplete={handleInterrogationComplete} />
      
      <CharacterProfiles onHoverChange={setIsHoveringCharacter} />

      <DistrictAnchor district="PUNCHINELLO'S MANSION" />
      
      <SceneTransitionSection isMobile={isMobile} />

      <DistrictAnchor district="THE FINAL NIGHT" />
      
      <InteractiveQuote 
        quote="I used to think there was a version of this where I got to stop. There isn't. There's just the next name on the list."
        author="Max Payne"
      />
      
      <Footer />
    </main>
  )
}
