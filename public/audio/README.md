# Audio files needed

The boot sequence and SFX system (`lib/sfx-manager.ts`) look for these files.
None are included — the site works fine without them (sounds just silently
no-op), but add them here for the full experience. All filenames must match
exactly.

| File | Used for | Length/type |
|---|---|---|
| `thunder-crack.mp3` | Boot sequence entry | One-shot, 1-3s |
| `rain-loop.mp3` | Ambient bed, boot + background | Seamless loop, 10-30s |
| `typewriter-key.mp3` | Boot narration typing | One-shot, very short (~80-120ms) |
| `vhs-glitch.mp3` | Boot -> hero transition | One-shot, 0.5-1s, noisy/static |
| `page-turn.mp3` | Chapter transitions (Phase 5+) | One-shot, 0.3-0.8s |
| `heartbeat.mp3` | Bullet-time interaction (Phase 6) | One-shot, 1-2s |
| `ambient-jazz.mp3` | Optional low-volume music bed | Seamless loop, 30s+ |
| `flashback-echo.mp3` | Flashback VFX moments (Phase 6) | One-shot, 1-2s, reverberant/echoed whisper or tone |

## Free, legal sources (royalty-free / CC0)

- **Pixabay Audio** (pixabay.com/sound-effects) — no attribution required, good rain/thunder/static selection.
- **Freesound.org** — filter search results to the "CC0" license specifically (other Freesound licenses require attribution).
- **Zapsplat** (zapsplat.com) — free tier requires a free account + attribution unless you're on a paid plan.

Search terms that work well: "thunder crack", "heavy rain loop", "typewriter key single", "VHS static glitch", "film reel page turn", "heartbeat slow tense", "noir jazz saxophone loop", "memory echo whisper reverb".

Keep total file size reasonable (all files under ~5MB combined ideally) since Vercel's free tier has a bandwidth cap — mp3 at 128kbps is plenty for ambience/SFX at this scale.
