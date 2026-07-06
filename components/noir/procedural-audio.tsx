"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Volume2, VolumeX, Play, Pause, ChevronDown, ChevronUp, Sliders } from "lucide-react"
import { cn } from "@/lib/utils"

interface AudioLayer {
  name: string
  volume: number
  enabled: boolean
}

interface ProceduralAudioProps {
  scrollProgress: number
  isHoveringCharacter: boolean
  performanceMode: boolean
  onPerformanceModeToggle: () => void
}

// Jazz chord progression in minor key: Dm, Gm, A7, Dm
const JAZZ_PROGRESSION = [
  { notes: [146.83, 174.61, 220.00, 261.63], duration: 8 }, // Dm (D3, F3, A3, C4)
  { notes: [196.00, 233.08, 293.66, 349.23], duration: 8 }, // Gm (G3, Bb3, D4, F4)
  { notes: [220.00, 277.18, 329.63, 415.30], duration: 8 }, // A7 (A3, C#4, E4, G4)
  { notes: [146.83, 174.61, 220.00, 261.63], duration: 8 }, // Dm (D3, F3, A3, C4)
]

export function ProceduralAudio({ 
  scrollProgress, 
  isHoveringCharacter, 
  performanceMode,
  onPerformanceModeToggle 
}: ProceduralAudioProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [layers, setLayers] = useState<AudioLayer[]>([
    { name: "Rain", volume: 0.6, enabled: true },
    { name: "Jazz", volume: 0.3, enabled: true },
    { name: "Drone", volume: 0.0, enabled: true },
  ])

  const audioContextRef = useRef<AudioContext | null>(null)
  const rainNoiseRef = useRef<{
    source: AudioBufferSourceNode | null
    filter: BiquadFilterNode | null
    gain: GainNode | null
  }>({ source: null, filter: null, gain: null })
  const jazzRef = useRef<{
    oscillators: OscillatorNode[]
    gains: GainNode[]
    masterGain: GainNode | null
  }>({ oscillators: [], gains: [], masterGain: null })
  const droneRef = useRef<{
    oscillator: OscillatorNode | null
    gain: GainNode | null
  }>({ oscillator: null, gain: null })
  const chordIndexRef = useRef(0)
  const jazzIntervalRef = useRef<NodeJS.Timeout>()

  // Create audio context
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    return audioContextRef.current
  }, [])

  // Generate white noise buffer for rain
  const createNoiseBuffer = useCallback((ctx: AudioContext): AudioBuffer => {
    const bufferSize = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }
    return buffer
  }, [])

  // Start rain ambience
  const startRain = useCallback(() => {
    const ctx = initAudioContext()
    if (ctx.state === "suspended") ctx.resume()

    // Create noise source
    const noiseBuffer = createNoiseBuffer(ctx)
    const source = ctx.createBufferSource()
    source.buffer = noiseBuffer
    source.loop = true

    // Create bandpass filter to shape noise into rain sound
    const filter = ctx.createBiquadFilter()
    filter.type = "bandpass"
    filter.frequency.value = 3000
    filter.Q.value = 0.5

    // Create gain node
    const gain = ctx.createGain()
    gain.gain.value = layers[0].volume * 0.3

    // Connect: source -> filter -> gain -> destination
    source.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    source.start()

    rainNoiseRef.current = { source, filter, gain }
  }, [initAudioContext, createNoiseBuffer, layers])

  // Start jazz loop
  const startJazz = useCallback(() => {
    const ctx = initAudioContext()
    if (ctx.state === "suspended") ctx.resume()

    const masterGain = ctx.createGain()
    masterGain.gain.value = layers[1].volume * 0.2
    masterGain.connect(ctx.destination)

    jazzRef.current = { oscillators: [], gains: [], masterGain }

    const playChord = () => {
      const chord = JAZZ_PROGRESSION[chordIndexRef.current % JAZZ_PROGRESSION.length]
      
      // Clear previous oscillators
      jazzRef.current.oscillators.forEach(osc => {
        try { osc.stop() } catch { /* ignore */ }
      })
      jazzRef.current.oscillators = []
      jazzRef.current.gains = []

      // Create oscillators for each note
      chord.notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        
        osc.type = i === 0 ? "sine" : "triangle"
        osc.frequency.value = freq
        
        // Slow attack envelope
        gain.gain.setValueAtTime(0, ctx.currentTime)
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.5)
        gain.gain.setValueAtTime(0.15, ctx.currentTime + chord.duration - 1)
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + chord.duration)

        osc.connect(gain)
        gain.connect(jazzRef.current.masterGain!)
        
        osc.start()
        osc.stop(ctx.currentTime + chord.duration)

        jazzRef.current.oscillators.push(osc)
        jazzRef.current.gains.push(gain)
      })

      chordIndexRef.current++
    }

    playChord()
    jazzIntervalRef.current = setInterval(playChord, 8000)
  }, [initAudioContext, layers])

  // Start sub-bass drone
  const startDrone = useCallback(() => {
    const ctx = initAudioContext()
    if (ctx.state === "suspended") ctx.resume()

    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.type = "sine"
    oscillator.frequency.value = 40 // Sub-bass at 40hz

    gain.gain.value = 0

    oscillator.connect(gain)
    gain.connect(ctx.destination)

    oscillator.start()

    droneRef.current = { oscillator, gain }
  }, [initAudioContext])

  // Stop all audio
  const stopAllAudio = useCallback(() => {
    // Stop rain
    if (rainNoiseRef.current.source) {
      try { rainNoiseRef.current.source.stop() } catch { /* ignore */ }
      rainNoiseRef.current = { source: null, filter: null, gain: null }
    }

    // Stop jazz
    if (jazzIntervalRef.current) clearInterval(jazzIntervalRef.current)
    jazzRef.current.oscillators.forEach(osc => {
      try { osc.stop() } catch { /* ignore */ }
    })
    jazzRef.current = { oscillators: [], gains: [], masterGain: null }

    // Stop drone
    if (droneRef.current.oscillator) {
      try { droneRef.current.oscillator.stop() } catch { /* ignore */ }
      droneRef.current = { oscillator: null, gain: null }
    }
  }, [])

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      stopAllAudio()
    } else {
      if (layers[0].enabled) startRain()
      if (layers[1].enabled) startJazz()
      if (layers[2].enabled) startDrone()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying, layers, startRain, startJazz, startDrone, stopAllAudio])

  // Update rain volume based on scroll
  useEffect(() => {
    if (rainNoiseRef.current.gain && isPlaying) {
      const baseVolume = layers[0].volume * 0.3
      const scrollModifier = 0.5 + scrollProgress * 0.5
      rainNoiseRef.current.gain.gain.linearRampToValueAtTime(
        baseVolume * scrollModifier,
        audioContextRef.current?.currentTime ?? 0 + 0.1
      )
    }
  }, [scrollProgress, layers, isPlaying])

  // Update drone based on character hover
  useEffect(() => {
    if (droneRef.current.gain && isPlaying && audioContextRef.current) {
      const targetVolume = isHoveringCharacter ? layers[2].volume * 0.4 : 0
      droneRef.current.gain.gain.linearRampToValueAtTime(
        targetVolume,
        audioContextRef.current.currentTime + 1.5
      )
    }
  }, [isHoveringCharacter, layers, isPlaying])

  // Update layer volumes
  const updateLayerVolume = useCallback((index: number, volume: number) => {
    setLayers(prev => {
      const newLayers = [...prev]
      newLayers[index] = { ...newLayers[index], volume }
      return newLayers
    })

    if (!isPlaying || !audioContextRef.current) return

    const ctx = audioContextRef.current
    const rampTime = ctx.currentTime + 1.5

    if (index === 0 && rainNoiseRef.current.gain) {
      rainNoiseRef.current.gain.gain.linearRampToValueAtTime(volume * 0.3, rampTime)
    }
    if (index === 1 && jazzRef.current.masterGain) {
      jazzRef.current.masterGain.gain.linearRampToValueAtTime(volume * 0.2, rampTime)
    }
    if (index === 2 && droneRef.current.gain && isHoveringCharacter) {
      droneRef.current.gain.gain.linearRampToValueAtTime(volume * 0.4, rampTime)
    }
  }, [isPlaying, isHoveringCharacter])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllAudio()
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [stopAllAudio])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Expanded controls */}
      {isExpanded && (
        <div className="bg-card/95 backdrop-blur-sm border border-border p-4 w-64 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-4">
            Soundscape Layers
          </p>
          
          {layers.map((layer, i) => (
            <div key={layer.name} className="mb-4 last:mb-0">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-foreground uppercase">{layer.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {Math.round(layer.volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={layer.volume * 100}
                onChange={(e) => updateLayerVolume(i, parseInt(e.target.value) / 100)}
                className="w-full h-1 bg-muted appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-none"
              />
            </div>
          ))}

          {/* Performance mode toggle */}
          <div className="mt-4 pt-4 border-t border-border">
            <button
              onClick={onPerformanceModeToggle}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 border transition-all duration-300",
                performanceMode 
                  ? "border-primary bg-primary/20 text-primary" 
                  : "border-border text-muted-foreground hover:border-primary"
              )}
            >
              <span className="font-mono text-xs uppercase tracking-widest">
                Performance Mode
              </span>
              <span className="font-mono text-xs">
                {performanceMode ? "ON" : "OFF"}
              </span>
            </button>
            <p className="font-mono text-[10px] text-muted-foreground mt-2">
              Reduces rain, disables grain, optimizes parallax
            </p>
          </div>
        </div>
      )}

      {/* Main controls */}
      <div className="flex items-center gap-3 bg-card/90 backdrop-blur-sm border border-border p-3">
        <button
          onClick={togglePlay}
          className="text-muted-foreground hover:text-primary transition-colors"
          aria-label={isPlaying ? "Pause soundscape" : "Play soundscape"}
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground hover:text-primary transition-colors"
          aria-label="Toggle mixer"
        >
          <Sliders className="w-5 h-5" />
        </button>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground hover:text-primary transition-colors"
          aria-label={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          {isPlaying ? "Playing" : "Ambient"}
        </span>
      </div>
    </div>
  )
}
