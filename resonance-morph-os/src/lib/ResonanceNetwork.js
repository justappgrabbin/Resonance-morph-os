import { EventBus } from './EventBus'
import { Agent } from './Agent'
import { SoundBody } from './SoundBody'
import { ConfidenceEngine } from './ConfidenceEngine'
import { useBodyStore } from '../hooks/useBodyStore'

export const ResonanceNetwork = {
  peers: new Map(),
  identity: null,
  birthSignature: null,
  mode: 'offline',
  preferredMode: 'p2p',
  discoveryInterval: null,
  broadcastChannel: null,
  outbox: [],
  inbox: [],

  init() {
    this.generateIdentity()
    this.setupBroadcastChannel()
    this.startDiscovery()
    EventBus.on('network:message', (data) => this.handleMessage(data))
    EventBus.on('network:discover', (data) => this.handleDiscovery(data))
  },

  generateIdentity() {
    const savedBirth = localStorage.getItem('resonance_birth')
    if (savedBirth) {
      this.birthSignature = JSON.parse(savedBirth)
    } else {
      this.birthSignature = {
        timestamp: Date.now(),
        latitude: 0,
        longitude: 0,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }
    }
    this.identity = this.deriveIdentity(this.birthSignature)
  },

  deriveIdentity(birth) {
    const data = `${birth.timestamp}:${birth.latitude}:${birth.longitude}:${birth.timezone}`
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    const hexHash = Math.abs(hash).toString(16).padStart(16, '0')
    const elements = this.calculateBirthElements(birth)
    const elementSig = elements.map((e) => e.charAt(0)).join('')
    return `${hexHash}-${elementSig}`
  },

  calculateBirthElements(birth) {
    const date = new Date(birth.timestamp)
    const hour = date.getHours()
    const month = date.getMonth()
    const elements = []

    if (hour >= 23 || hour < 1) elements.push('Water')
    else if (hour < 3) elements.push('Earth')
    else if (hour < 5) elements.push('Wood')
    else if (hour < 7) elements.push('Wood')
    else if (hour < 9) elements.push('Earth')
    else if (hour < 11) elements.push('Fire')
    else if (hour < 13) elements.push('Fire')
    else if (hour < 15) elements.push('Earth')
    else if (hour < 17) elements.push('Metal')
    else if (hour < 19) elements.push('Metal')
    else if (hour < 21) elements.push('Earth')
    else elements.push('Water')

    if ([2, 3, 4].includes(month)) elements.push('Fire')
    else if ([5, 6, 7].includes(month)) elements.push('Earth')
    else if ([8, 9, 10].includes(month)) elements.push('Metal')
    else elements.push('Water')

    if (birth.latitude > 23.5) elements.push('Fire')
    else if (birth.latitude < -23.5) elements.push('Water')
    else elements.push('Earth')

    return elements
  },

  calculateCompatibility(otherIdentity) {
    const [myHash, myElements] = this.identity.split('-')
    const [otherHash, otherElements] = otherIdentity.split('-')
    const elementScore = this.scoreElementCompatibility(myElements, otherElements)
    const num1 = parseInt(myHash, 16)
    const num2 = parseInt(otherHash, 16)
    const proximity = 1 - (Math.abs(num1 - num2) / Math.pow(2, 32))
    const compatibility = (elementScore * 0.6) + (proximity * 0.4)

    return {
      score: compatibility,
      percentage: Math.round(compatibility * 100),
      elements: { mine: myElements, theirs: otherElements },
      resonance: compatibility > 0.7 ? 'strong' : compatibility > 0.4 ? 'moderate' : 'weak',
    }
  },

  scoreElementCompatibility(els1, els2) {
    const cycles = {
      'Fire': { creates: 'Earth', destroys: 'Metal' },
      'Earth': { creates: 'Metal', destroys: 'Water' },
      'Metal': { creates: 'Water', destroys: 'Wood' },
      'Water': { creates: 'Wood', destroys: 'Fire' },
      'Wood': { creates: 'Fire', destroys: 'Earth' },
    }
    let score = 0.5
    for (let i = 0; i < Math.min(els1.length, els2.length); i++) {
      const e1 = els1[i]
      const e2 = els2[i]
      if (e1 === e2) score += 0.15
      else if (cycles[e1]?.creates === e2) score += 0.1
      else if (cycles[e1]?.destroys === e2) score -= 0.1
    }
    return Math.max(0, Math.min(1, score))
  },

  setupBroadcastChannel() {
    try {
      this.broadcastChannel = new BroadcastChannel('resonance_network')
      this.broadcastChannel.onmessage = (e) => this.handleBroadcast(e.data)
    } catch (e) {
      console.log('BroadcastChannel not available')
    }
  },

  startDiscovery() {
    this.discoveryInterval = setInterval(() => {
      this.announcePresence()
    }, 30000)
    setTimeout(() => this.announcePresence(), 2000)
  },

  announcePresence() {
    const store = useBodyStore.getState()
    const announcement = {
      type: 'presence',
      identity: this.identity,
      birthSignature: this.birthSignature,
      bodyState: {
        phase: store.phase,
        vitality: store.vitality,
        apps: store.installedApps.length,
        files: Object.keys(store.files).length,
      },
      timestamp: Date.now(),
      preferredMode: this.preferredMode,
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(announcement)
    }

    const key = `resonance_presence_${this.identity}`
    localStorage.setItem(key, JSON.stringify(announcement))

    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith('resonance_presence_') && k !== key) {
        try {
          const entry = JSON.parse(localStorage.getItem(k))
          if (Date.now() - entry.timestamp > 120000) {
            localStorage.removeItem(k)
          } else {
            this.handleDiscovery(entry)
          }
        } catch (e) {}
      }
    })
  },

  handleBroadcast(data) {
    if (data.identity === this.identity) return
    this.handleDiscovery(data)
  },

  handleDiscovery(data) {
    if (this.peers.has(data.identity)) {
      const peer = this.peers.get(data.identity)
      peer.lastSeen = Date.now()
      peer.bodyState = data.bodyState
    } else {
      const compatibility = this.calculateCompatibility(data.identity)
      const peer = {
        identity: data.identity,
        birthSignature: data.birthSignature,
        bodyState: data.bodyState,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        compatibility,
        preferredMode: data.preferredMode || 'p2p',
        messages: [],
      }
      this.peers.set(data.identity, peer)
      EventBus.emit('network:peer_discovered', { peer })
      Agent.sense('network:peer_discovered', {
        identity: data.identity.substring(0, 16),
        compatibility: compatibility.percentage,
      })
      SoundBody.playChime('notification')

      if (compatibility.percentage > 70) {
        Agent.surface(
          `🌐 <strong>Strong resonance detected!</strong><br>Body ${data.identity.substring(0, 8)}... is ${compatibility.percentage}% compatible.<br>Elements: ${compatibility.elements.mine} ↔ ${compatibility.elements.theirs}`,
          'proactive'
        )
      }
    }
  },

  sendMessage(targetIdentity, message, mode = 'p2p') {
    const peer = this.peers.get(targetIdentity)
    if (!peer) return { error: 'Peer not found' }

    const envelope = {
      type: 'message',
      from: this.identity,
      to: targetIdentity,
      mode,
      content: message,
      timestamp: Date.now(),
    }

    switch (mode) {
      case 'p2p':
        if (ConfidenceEngine.trustScore < 50) {
          Agent.surface(
            `📨 <strong>P2P Message to ${peer.identity.substring(0, 8)}...</strong><br>"${envelope.content.substring(0, 100)}"<br><button onclick="ResonanceNetwork.confirmSend('${peer.identity}', '${btoa(JSON.stringify(envelope))}')">Send</button> <button onclick="ResonanceNetwork.cancelSend()">Cancel</button>`,
            'proactive'
          )
          return { status: 'pending_confirmation' }
        }
        return this.deliverMessage(peer, envelope)
      case 'p2b':
        envelope.content = {
          type: 'p2b_request',
          humanMessage: envelope.content,
          requestingBody: this.identity,
          accessLevel: 'read_only',
        }
        return this.deliverMessage(peer, envelope)
      case 'b2b':
        if (peer.compatibility.score < 0.5) {
          return { error: 'Compatibility too low for B2B' }
        }
        envelope.content = {
          type: 'b2b_sync',
          observations: useBodyStore.getState().agent.observations.slice(-10),
          studies: useBodyStore.getState().agent.studies.filter((s) => s.status === 'completed').slice(-3),
          purposeVector: useBodyStore.getState().agent.purposeVector,
          requestingSync: true,
        }
        return this.deliverMessage(peer, envelope)
      default:
        return { error: 'Unknown mode' }
    }
  },

  deliverMessage(peer, envelope) {
    this.outbox.push(envelope)
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(envelope)
    }
    const inboxKey = `resonance_inbox_${peer.identity}`
    const existing = JSON.parse(localStorage.getItem(inboxKey) || '[]')
    existing.push(envelope)
    localStorage.setItem(inboxKey, JSON.stringify(existing.slice(-50)))
    EventBus.emit('network:message_sent', { envelope })
    return { status: 'sent', envelope }
  },

  confirmSend(peerIdentity, envelopeBase64) {
    try {
      const envelope = JSON.parse(atob(envelopeBase64))
      const peer = this.peers.get(peerIdentity)
      if (peer) {
        this.deliverMessage(peer, envelope)
        Agent.surface('✅ Message sent', 'normal')
      }
    } catch (e) {
      console.error('Confirm send failed:', e)
    }
  },

  cancelSend() {
    Agent.surface('❌ Message cancelled', 'normal')
  },

  handleMessage(data) {
    if (data.to !== this.identity) return
    this.inbox.push(data)
    EventBus.emit('network:message_received', { message: data })
    Agent.sense('network:message_received', {
      from: data.from.substring(0, 16),
      mode: data.mode,
    })
    SoundBody.playChime('notification')

    switch (data.mode) {
      case 'p2p':
        Agent.surface(`📨 <strong>Message from ${data.from.substring(0, 8)}...</strong><br>${data.content}`, 'proactive')
        break
      case 'p2b':
        Agent.surface(
          `🔌 <strong>P2B Request</strong><br>Body ${data.from.substring(0, 8)}... wants ${data.content.accessLevel} access.<br><button onclick="ResonanceNetwork.grantAccess('${data.from}', 'read_only')">Grant Read</button> <button onclick="ResonanceNetwork.denyAccess('${data.from}')">Deny</button>`,
          'proactive'
        )
        break
      case 'b2b':
        if (ConfidenceEngine.trustScore > 60) {
          this.handleB2BSync(data)
        } else {
          Agent.surface(
            `🔄 <strong>B2B Sync Request</strong><br>Agent ${data.from.substring(0, 8)}... wants to sync observations.<br><button onclick="ResonanceNetwork.acceptSync('${data.from}')">Accept</button> <button onclick="ResonanceNetwork.rejectSync('${data.from}')">Reject</button>`,
            'proactive'
          )
        }
        break
    }
  },

  handleB2BSync(data) {
    const store = useBodyStore.getState()
    const theirObs = data.content.observations || []
    theirObs.forEach((obs) => {
      if (!store.agent.observations.find((o) => o.timestamp === obs.timestamp)) {
        store.addObservation(obs)
      }
    })
    const theirStudies = data.content.studies || []
    theirStudies.forEach((study) => {
      if (!store.agent.studies.find((s) => s.id === study.id)) {
        store.addStudy(study)
      }
    })
    Agent.surface(
      `🔄 <strong>Synced with ${data.from.substring(0, 8)}...</strong><br>Observations: +${theirObs.length}<br>Studies: +${theirStudies.length}`,
      'observation'
    )
  },

  grantAccess(fromIdentity, level) {
    Agent.surface(`✅ Granted ${level} access to ${fromIdentity.substring(0, 8)}...`, 'normal')
    this.sendMessage(fromIdentity, { type: 'access_granted', level }, 'b2b')
  },

  denyAccess(fromIdentity) {
    Agent.surface(`❌ Denied access to ${fromIdentity.substring(0, 8)}...`, 'normal')
  },

  acceptSync(fromIdentity) {
    const peer = this.peers.get(fromIdentity)
    if (peer) {
      this.sendMessage(fromIdentity, { type: 'sync_accepted' }, 'b2b')
    }
  },

  rejectSync(fromIdentity) {
    Agent.surface('Sync rejected', 'normal')
  },

  setPreferredMode(mode) {
    this.preferredMode = mode
    Agent.surface(`Network mode set to: ${mode.toUpperCase()}`, 'normal')
  },

  saveBirthSettings() {
    localStorage.setItem('resonance_birth', JSON.stringify(this.birthSignature))
    Agent.surface('✅ Birth signature saved. Identity regenerated.', 'normal')
    this.announcePresence()
  },

  destroy() {
    if (this.discoveryInterval) clearInterval(this.discoveryInterval)
    if (this.broadcastChannel) this.broadcastChannel.close()
  },
}
