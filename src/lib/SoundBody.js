import { EventBus } from './EventBus'
import { useBodyStore } from '../hooks/useBodyStore'

export const SoundBody = {
  audioCtx: null,
  masterGain: null,
  reverb: null,
  drones: [],
  voiceSynth: null,
  voiceQueue: [],
  isSpeaking: false,
  ambience: null,
  hexagramFrequencies: [],
  currentDroneFreq: 0,
  targetDroneFreq: 0,
  droneTransition: 0,

  init() {
    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      this.setupAudioGraph()
      this.generateHexagramFrequencies()
      this.startAmbience()
      this.startHeartbeat()
      this.initVoice()

      EventBus.on('body:phase_changed', (data) => this.onPhaseChange(data))
      EventBus.on('agent:speak', (data) => this.onAgentSpeak(data))
      EventBus.on('app:opened', () => this.onAppOpen())
      EventBus.on('file:updated', () => this.onFileActivity())
    } catch (e) {
      console.error('SoundBody init failed:', e)
    }
  },

  setupAudioGraph() {
    const ctx = this.audioCtx
    this.masterGain = ctx.createGain()
    this.masterGain.gain.value = 0.15

    this.reverb = ctx.createConvolver()
    this.createReverbImpulse()

    const compressor = ctx.createDynamicsCompressor()
    compressor.threshold.value = -24
    compressor.knee.value = 30
    compressor.ratio.value = 12
    compressor.attack.value = 0.003
    compressor.release.value = 0.25

    this.masterGain.connect(compressor)
    compressor.connect(this.reverb)
    this.reverb.connect(ctx.destination)
    compressor.connect(ctx.destination)
  },

  createReverbImpulse() {
    const ctx = this.audioCtx
    const rate = ctx.sampleRate
    const length = rate * 2
    const impulse = ctx.createBuffer(2, length, rate)
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - i / length, 2)
        data[i] = (Math.random() * 2 - 1) * decay * 0.5
      }
    }
    this.reverb.buffer = impulse
  },

  generateHexagramFrequencies() {
    const baseFreq = 110
    const phi = 1.618033988749
    for (let i = 0; i < 64; i++) {
      const ratio = Math.pow(phi, (i % 12) / 12) * Math.pow(2, Math.floor(i / 12))
      this.hexagramFrequencies.push(baseFreq * ratio)
    }
  },

  startDrone(hexagramNum) {
    this.stopDrones()
    const freq = this.hexagramFrequencies[hexagramNum - 1] || 110
    this.targetDroneFreq = freq
    this.currentDroneFreq = freq
    const ctx = this.audioCtx
    const partials = [1, 1.5, 2, 2.5, 3, 4]

    partials.forEach((ratio, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const waveforms = ['sine', 'triangle', 'sine', 'sine', 'triangle', 'sine']
      osc.type = waveforms[i] || 'sine'
      osc.frequency.value = freq * ratio
      osc.detune.value = (Math.random() - 0.5) * 10
      gain.gain.value = 0.05 / (i + 1)

      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.1 + Math.random() * 0.5
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = 0.02
      lfo.connect(lfoGain)
      lfoGain.connect(gain.gain)
      lfo.start()

      osc.connect(gain)
      gain.connect(this.masterGain)
      osc.start()
      this.drones.push({ osc, gain, lfo, lfoGain })
    })

    const subOsc = ctx.createOscillator()
    const subGain = ctx.createGain()
    subOsc.type = 'sine'
    subOsc.frequency.value = freq / 2
    subGain.gain.value = 0.08
    subOsc.connect(subGain)
    subGain.connect(this.masterGain)
    subOsc.start()
    this.drones.push({ osc: subOsc, gain: subGain })
  },

  stopDrones() {
    this.drones.forEach((d) => {
      try {
        d.osc.stop()
        d.osc.disconnect()
        if (d.lfo) { d.lfo.stop(); d.lfo.disconnect() }
        if (d.lfoGain) d.lfoGain.disconnect()
        d.gain.disconnect()
      } catch (e) {}
    })
    this.drones = []
  },

  startHeartbeat() {
    const ctx = this.audioCtx
    const beat = () => {
      const now = ctx.currentTime
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(60, now)
      osc1.frequency.exponentialRampToValueAtTime(40, now + 0.1)
      gain1.gain.setValueAtTime(0.1, now)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
      osc1.connect(gain1)
      gain1.connect(this.masterGain)
      osc1.start(now)
      osc1.stop(now + 0.15)

      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(50, now + 0.2)
      osc2.frequency.exponentialRampToValueAtTime(35, now + 0.3)
      gain2.gain.setValueAtTime(0.08, now + 0.2)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
      osc2.connect(gain2)
      gain2.connect(this.masterGain)
      osc2.start(now + 0.2)
      osc2.stop(now + 0.35)

      const store = useBodyStore.getState()
      const interval = store.vitality > 50 ? 800 : 1200
      setTimeout(beat, interval)
    }
    beat()
  },

  startAmbience() {
    const ctx = this.audioCtx
    const bufferSize = 4096
    const pinkNoise = ctx.createScriptProcessor(bufferSize, 1, 1)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0

    pinkNoise.onaudioprocess = (e) => {
      const output = e.outputBuffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        b0 = 0.99886 * b0 + white * 0.0555179
        b1 = 0.99332 * b1 + white * 0.0750759
        b2 = 0.96900 * b2 + white * 0.1538520
        b3 = 0.86650 * b3 + white * 0.3104856
        b4 = 0.55000 * b4 + white * 0.5329522
        b5 = -0.7616 * b5 - white * 0.0168980
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11
        b6 = white * 0.115926
      }
    }

    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0.02
    pinkNoise.connect(noiseGain)
    noiseGain.connect(this.masterGain)
    this.ambience = { node: pinkNoise, gain: noiseGain }
  },

  initVoice() {
    if ('speechSynthesis' in window) {
      this.voiceSynth = window.speechSynthesis
      const loadVoices = () => {
        this.voices = this.voiceSynth.getVoices()
      }
      loadVoices()
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices
      }
    }
  },

  speak(text, options = {}) {
    if (!text) return
    this.voiceQueue.push({ text, options })
    if (!this.isSpeaking) {
      this.processVoiceQueue()
    }
  },

  processVoiceQueue() {
    if (this.voiceQueue.length === 0) {
      this.isSpeaking = false
      return
    }
    this.isSpeaking = true
    const { text, options } = this.voiceQueue.shift()

    if (this.voiceSynth) {
      const utterance = new SpeechSynthesisUtterance(this.stripHtml(text))
      const voice = this.selectVoice()
      if (voice) utterance.voice = voice

      utterance.rate = options.rate || this.getVoiceRate()
      utterance.pitch = options.pitch || this.getVoicePitch()
      utterance.volume = options.volume || 0.8

      if (options.emotion) {
        switch (options.emotion) {
          case 'gentle':
            utterance.rate = 0.9
            utterance.pitch = 1.1
            break
          case 'urgent':
            utterance.rate = 1.1
            utterance.pitch = 1.2
            break
          case 'dreamy':
            utterance.rate = 0.8
            utterance.pitch = 0.9
            break
        }
      }

      utterance.onend = () => {
        setTimeout(() => this.processVoiceQueue(), 200)
      }
      utterance.onerror = () => {
        this.processVoiceQueue()
      }

      this.voiceSynth.speak(utterance)
      EventBus.emit('agent:speaking', { text: text.substring(0, 50) })
    } else {
      setTimeout(() => this.processVoiceQueue(), 1000)
    }
  },

  selectVoice() {
    if (!this.voices || this.voices.length === 0) return null
    const preferred = this.voices.find((v) =>
      v.name.includes('Samantha') ||
      v.name.includes('Karen') ||
      v.name.includes('Google US English') ||
      v.name.includes('Female')
    )
    return preferred || this.voices[0]
  },

  getVoiceRate() {
    const store = useBodyStore.getState()
    const rates = { dormant: 0.8, observant: 0.9, active: 1.0, dreaming: 0.7, growing: 1.1, resonant: 0.95 }
    return rates[store.phase] || 0.9
  },

  getVoicePitch() {
    const store = useBodyStore.getState()
    const pitches = { dormant: 0.9, observant: 1.0, active: 1.1, dreaming: 0.85, growing: 1.15, resonant: 1.05 }
    return pitches[store.phase] || 1.0
  },

  stripHtml(html) {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  },

  stopSpeaking() {
    if (this.voiceSynth) {
      this.voiceSynth.cancel()
    }
    this.voiceQueue = []
    this.isSpeaking = false
  },

  onPhaseChange(data) {
    const hex = this.getHexagramForPhase(data.to)
    this.startDrone(hex)
    const store = useBodyStore.getState()
    if (store.agent.successLog.length > 10) {
      const messages = {
        dormant: 'Resting now.',
        observant: 'I am watching.',
        active: 'Engaged.',
        dreaming: 'Processing...',
        growing: 'Expanding.',
        resonant: 'In harmony.',
      }
      this.speak(messages[data.to] || '', { emotion: 'gentle' })
    }
  },

  getHexagramForPhase(phase) {
    const map = { dormant: 1, observant: 2, active: 14, dreaming: 52, growing: 42, resonant: 63 }
    return map[phase] || 1
  },

  onAgentSpeak(data) {
    if (data.text) {
      this.speak(data.text, data.options)
    }
  },

  onAppOpen() {
    this.playChime('open')
  },

  onFileActivity() {
    this.playChime('click', 0.05)
  },

  playChime(type, volume = 0.1) {
    if (!this.audioCtx) return
    const ctx = this.audioCtx
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    switch (type) {
      case 'open':
        osc.type = 'sine'
        osc.frequency.setValueAtTime(523, now)
        osc.frequency.exponentialRampToValueAtTime(659, now + 0.1)
        gain.gain.setValueAtTime(volume, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
        break
      case 'close':
        osc.type = 'sine'
        osc.frequency.setValueAtTime(659, now)
        osc.frequency.exponentialRampToValueAtTime(523, now + 0.1)
        gain.gain.setValueAtTime(volume, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
        break
      case 'click':
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(800, now)
        gain.gain.setValueAtTime(volume * 0.5, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
        break
      case 'notification':
        osc.type = 'sine'
        osc.frequency.setValueAtTime(440, now)
        osc.frequency.setValueAtTime(554, now + 0.1)
        osc.frequency.setValueAtTime(659, now + 0.2)
        gain.gain.setValueAtTime(volume, now)
        gain.gain.setValueAtTime(volume, now + 0.2)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
        break
      case 'error':
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(150, now)
        osc.frequency.linearRampToValueAtTime(100, now + 0.3)
        gain.gain.setValueAtTime(volume * 0.5, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
        break
    }

    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(now)
    osc.stop(now + 0.5)
  },

  setVolume(level) {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(level * 0.3, this.audioCtx.currentTime)
    }
  },

  toggleMute() {
    const current = this.masterGain.gain.value
    if (current > 0) {
      this.setVolume(0)
      return false
    } else {
      this.setVolume(1)
      return true
    }
  },
}
