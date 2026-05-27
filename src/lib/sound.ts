// Web Audio API sound synthesizer — zero external files

class SoundManager {
  private ctx: AudioContext | null = null
  private _enabled = false

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    if (this.ctx.state === 'suspended') this.ctx.resume()
    return this.ctx
  }

  get enabled() { return this._enabled }

  toggle(): boolean {
    this._enabled = !this._enabled
    return this._enabled
  }

  // Crisp metallic clink — code success
  success() {
    if (!this._enabled) return
    const ctx = this.getCtx()
    const t = ctx.currentTime
    const freqs = [880, 1108, 1320]
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, t + i * 0.04)
      gain.gain.setValueAtTime(0.22, t + i * 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.04 + 0.35)
      osc.start(t + i * 0.04)
      osc.stop(t + i * 0.04 + 0.35)
    })
  }

  // Deep level-up pulse
  levelUp() {
    if (!this._enabled) return
    const ctx = this.getCtx()
    const t = ctx.currentTime

    // Sub-bass thud
    const sub = ctx.createOscillator()
    const subGain = ctx.createGain()
    sub.type = 'sine'
    sub.connect(subGain); subGain.connect(ctx.destination)
    sub.frequency.setValueAtTime(60, t)
    sub.frequency.exponentialRampToValueAtTime(40, t + 0.5)
    subGain.gain.setValueAtTime(0.4, t)
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.6)
    sub.start(t); sub.stop(t + 0.6)

    // Rising harmonic sweep — triumph
    const sweep = ctx.createOscillator()
    const sweepGain = ctx.createGain()
    sweep.type = 'sawtooth'
    sweep.connect(sweepGain); sweepGain.connect(ctx.destination)
    sweep.frequency.setValueAtTime(220, t + 0.1)
    sweep.frequency.exponentialRampToValueAtTime(880, t + 0.5)
    sweepGain.gain.setValueAtTime(0.0, t + 0.1)
    sweepGain.gain.linearRampToValueAtTime(0.15, t + 0.25)
    sweepGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7)
    sweep.start(t + 0.1); sweep.stop(t + 0.7)
  }

  // Harsh buzz — error
  error() {
    if (!this._enabled) return
    const ctx = this.getCtx()
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(180, t)
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.18)
    gain.gain.setValueAtTime(0.15, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
    osc.start(t); osc.stop(t + 0.18)
  }

  // Quick mechanical click — run
  run() {
    if (!this._enabled) return
    const ctx = this.getCtx()
    const t = ctx.currentTime
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 4)
    }
    const src = ctx.createBufferSource()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 2000
    src.buffer = buf
    src.connect(filter); filter.connect(gain); gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.3, t)
    src.start(t)
  }
}

export const sound = new SoundManager()
