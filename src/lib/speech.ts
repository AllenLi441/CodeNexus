'use client'

// Lightweight wrapper around the browser's built-in speech synthesis
// (Web Speech API). No downloads, no network, no API key — the device's own
// voices speak the assistant's lines. Degrades gracefully to silent text when
// the browser has no usable voice (e.g. some Linux/Chrome builds).
import { useCallback, useEffect, useRef, useState } from 'react'

const ENABLED_KEY = 'cn:speech:enabled'
const VOICE_KEY = 'cn:speech:voice'

function speechAvailable() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window
}

function langPrefix(lang: 'zh' | 'en') {
  return lang === 'zh' ? 'zh' : 'en'
}

export type UseSpeech = {
  supported: boolean
  enabled: boolean
  setEnabled: (on: boolean) => void
  voices: SpeechSynthesisVoice[]
  // True when the device actually has a voice for the current language. When
  // false, speech still works via the browser default, but quality/coverage is
  // poor (common on Android/Linux/Chrome with no Chinese voice) — the UI warns.
  langVoiceAvailable: boolean
  voiceURI: string
  setVoiceURI: (uri: string) => void
  speaking: boolean
  speak: (text: string, onDone?: () => void) => void
  cancel: () => void
}

export function useSpeech(lang: 'zh' | 'en'): UseSpeech {
  const supported = speechAvailable()
  const [enabled, setEnabledState] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [langVoiceAvailable, setLangVoiceAvailable] = useState(false)
  const [voiceURI, setVoiceURIState] = useState('')
  const [speaking, setSpeaking] = useState(false)
  // Hold the latest onDone so a cancel/replace doesn't leave a dangling promise.
  const doneRef = useRef<(() => void) | null>(null)

  // Restore persisted prefs (best-effort). Deferred off the synchronous effect
  // body so we don't trigger cascading renders (React 19 set-state-in-effect).
  useEffect(() => {
    if (!supported) return
    let cancelled = false
    void Promise.resolve().then(() => {
      if (cancelled) return
      try {
        setEnabledState(window.localStorage.getItem(ENABLED_KEY) === '1')
        setVoiceURIState(window.localStorage.getItem(VOICE_KEY) ?? '')
      } catch {
        // ignore
      }
    })
    return () => { cancelled = true }
  }, [supported])

  // Load voices for the active language. getVoices() is often empty until the
  // async 'voiceschanged' event fires, so we listen for it.
  useEffect(() => {
    if (!supported) return
    const load = () => {
      const all = window.speechSynthesis.getVoices()
      const prefix = langPrefix(lang)
      const matching = all.filter((v) => v.lang?.toLowerCase().startsWith(prefix))
      setVoices(matching.length ? matching : all)
      setLangVoiceAvailable(matching.length > 0)
    }
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load)
  }, [supported, lang])

  const cancel = useCallback(() => {
    if (!supported) return
    try {
      window.speechSynthesis.cancel()
    } catch {
      // ignore
    }
    doneRef.current = null
    setSpeaking(false)
  }, [supported])

  const speak = useCallback(
    (text: string, onDone?: () => void) => {
      const finish = () => {
        if (doneRef.current === onDone) doneRef.current = null
        setSpeaking(false)
        onDone?.()
      }
      // Not enabled / unsupported / empty → behave as an instant no-op so callers
      // can always pass an onDone advance callback regardless of voice state.
      if (!supported || !enabled || !text.trim()) {
        onDone?.()
        return
      }
      try {
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(text)
        u.lang = lang === 'zh' ? 'zh-CN' : 'en-US'
        u.rate = 1.02
        const chosen =
          (voiceURI && voices.find((v) => v.voiceURI === voiceURI)) || voices[0]
        if (chosen) u.voice = chosen
        u.onend = finish
        u.onerror = finish
        doneRef.current = onDone ?? null
        setSpeaking(true)
        window.speechSynthesis.speak(u)
      } catch {
        finish()
      }
    },
    [supported, enabled, lang, voiceURI, voices],
  )

  const setEnabled = useCallback(
    (on: boolean) => {
      setEnabledState(on)
      try {
        window.localStorage.setItem(ENABLED_KEY, on ? '1' : '0')
      } catch {
        // ignore
      }
      if (!on) cancel()
    },
    [cancel],
  )

  const setVoiceURI = useCallback((uri: string) => {
    setVoiceURIState(uri)
    try {
      window.localStorage.setItem(VOICE_KEY, uri)
    } catch {
      // ignore
    }
  }, [])

  // Stop any speech on unmount.
  useEffect(() => cancel, [cancel])

  return { supported, enabled, setEnabled, voices, langVoiceAvailable, voiceURI, setVoiceURI, speaking, speak, cancel }
}
