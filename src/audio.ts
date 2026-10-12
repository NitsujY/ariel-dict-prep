// Speech via browser speechSynthesis; optional pre-recorded files preferred.
import type { Settings, WordEntry } from './types'

export const speechSupported =
  typeof window !== 'undefined' && 'speechSynthesis' in window

/** Voices can arrive late; wait for voiceschanged, with a timeout for browsers that never fire it. */
export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!speechSupported) return Promise.resolve([])
  const now = speechSynthesis.getVoices()
  if (now.length > 0) return Promise.resolve(now)
  return new Promise((res) => {
    const timer = setTimeout(() => res(speechSynthesis.getVoices()), 1500)
    speechSynthesis.addEventListener(
      'voiceschanged',
      () => {
        clearTimeout(timer)
        res(speechSynthesis.getVoices())
      },
      { once: true },
    )
  })
}

export function stopSpeak(): void {
  if (speechSupported) speechSynthesis.cancel()
}

/** Returns false when speech is unavailable so the UI can ask a parent to read aloud. */
export function speakWord(text: string, s: Settings, lang = 'en-GB'): boolean {
  if (!speechSupported) return false
  stopSpeak() // repeated taps restart instead of queueing
  const u = new SpeechSynthesisUtterance(text)
  u.lang = lang
  u.rate = s.rate
  const voice = speechSynthesis.getVoices().find((v) => v.voiceURI === s.voiceURI)
  if (voice) u.voice = voice
  speechSynthesis.speak(u)
  return true
}

let filePlayer: HTMLAudioElement | null = null

/** Prefer a supplied audio file; fall back to speechSynthesis on error. */
export function playWord(
  entry: WordEntry,
  s: Settings,
  lang: string,
  onUnavailable: () => void,
): void {
  stopSpeak()
  if (filePlayer) {
    filePlayer.pause()
    filePlayer = null
  }
  if (entry.audio) {
    const a = new Audio(`${import.meta.env.BASE_URL}${entry.audio}`)
    filePlayer = a
    a.play().catch(() => {
      filePlayer = null
      if (!speakWord(entry.word, s, lang)) onUnavailable()
    })
    a.onerror = () => {
      filePlayer = null
      if (!speakWord(entry.word, s, lang)) onUnavailable()
    }
    return
  }
  if (!speakWord(entry.word, s, lang)) onUnavailable()
}

export function stopAll(): void {
  stopSpeak()
  if (filePlayer) {
    filePlayer.pause()
    filePlayer = null
  }
}
