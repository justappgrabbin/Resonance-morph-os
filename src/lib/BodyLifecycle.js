import { useBodyStore } from '../hooks/useBodyStore'
import { EventBus } from './EventBus'
import { Agent } from './Agent'

export const BodyLifecycle = {
  timer: null,

  start() {
    this.timer = setInterval(() => this.cycle(), 5000)
    this.cycle()
  },

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },

  cycle() {
    const store = useBodyStore.getState()
    store.incrementCycle()

    const idle = Date.now() - store.lastActivity
    const wasActive = idle < 30000
    const wasIdle = idle > 120000

    if (wasIdle && store.phase !== 'dormant') {
      this.transition('dormant')
    } else if (wasActive && store.phase === 'dormant') {
      this.transition('observant')
    } else if (wasActive && store.phase === 'observant' && Object.keys(store.windows).length > 0) {
      this.transition('active')
    }

    this.breathe()

    if (store.cycleCount % 6 === 0) {
      this.autosave()
    }

    if (store.cycleCount % 60 === 0) {
      this.integrityCheck()
    }
  },

  transition(newPhase) {
    const store = useBodyStore.getState()
    const oldPhase = store.phase
    store.setPhase(newPhase)

    const vitalityMap = {
      dormant: 10,
      observant: 30,
      active: 60,
      dreaming: 45,
      growing: 80,
      resonant: 95,
    }
    store.setVitality(vitalityMap[newPhase] || 50)

    EventBus.emit('body:phase_changed', { from: oldPhase, to: newPhase })
    Agent.surface(`Body transitioned: ${oldPhase} → ${newPhase}`, 'observation')
  },

  breathe() {
    const phases = ['inhale', 'hold', 'exhale', 'hold']
    const index = Math.floor(Date.now() / 5000) % 4
    // Could emit breath event for visual effects
  },

  autosave() {
    const store = useBodyStore.getState()
    // Zustand persist handles most, but we can save agent state explicitly
    const agentState = {
      purposeVector: store.agent.purposeVector,
      humanTrajectory: store.agent.humanTrajectory,
      agentTrajectory: store.agent.agentTrajectory,
      driftAlerts: store.agent.driftAlerts,
      observations: store.agent.observations,
      studies: store.agent.studies,
      papers: store.agent.papers,
      successLog: store.agent.successLog,
      memoryGraph: store.agent.memoryGraph,
      savedAt: Date.now(),
    }
    localStorage.setItem('resonance_agent', JSON.stringify(agentState))
    EventBus.emit('body:autosaved', { timestamp: Date.now() })
  },

  integrityCheck() {
    const store = useBodyStore.getState()
    let issues = []

    try {
      JSON.parse(localStorage.getItem('resonance-body-storage') || '{}')
    } catch (e) {
      issues.push('Storage corruption detected')
    }

    if (issues.length > 0) {
      store.updateAgent({ integrity: Math.max(0, store.integrity - 10) })
      EventBus.emit('body:integrity_warning', { issues })
      Agent.surface(`⚠️ Integrity check: ${issues.join(', ')}`, 'proactive')
    } else {
      store.updateAgent({ integrity: Math.min(100, store.integrity + 5) })
    }
  },
}
