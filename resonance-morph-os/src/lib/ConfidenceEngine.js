import { useBodyStore } from '../hooks/useBodyStore'
import { EventBus } from './EventBus'

export const ConfidenceEngine = {
  globalConfidence: 0,
  trustScore: 0,
  observationHours: 0,
  successRate: 0,
  totalActions: 0,
  successfulActions: 0,

  domains: {
    file_management: { confidence: 0, successes: 0, attempts: 0 },
    code_generation: { confidence: 0, successes: 0, attempts: 0 },
    research: { confidence: 0, successes: 0, attempts: 0 },
    organization: { confidence: 0, successes: 0, attempts: 0 },
    communication: { confidence: 0, successes: 0, attempts: 0 },
    creative: { confidence: 0, successes: 0, attempts: 0 },
  },

  THRESHOLD_ASK: 0.30,
  THRESHOLD_SUGGEST: 0.50,
  THRESHOLD_CONFIRM: 0.70,
  THRESHOLD_ACT: 0.70,

  init() {
    this.loadState()
    this.startDecayTimer()
  },

  loadState() {
    try {
      const saved = localStorage.getItem('resonance_confidence')
      if (saved) {
        const parsed = JSON.parse(saved)
        this.globalConfidence = parsed.globalConfidence || 0
        this.trustScore = parsed.trustScore || 0
        this.observationHours = parsed.observationHours || 0
        this.successRate = parsed.successRate || 0
        this.totalActions = parsed.totalActions || 0
        this.successfulActions = parsed.successfulActions || 0
        if (parsed.domains) this.domains = { ...this.domains, ...parsed.domains }
      }
    } catch (e) {}
  },

  saveState() {
    localStorage.setItem('resonance_confidence', JSON.stringify({
      globalConfidence: this.globalConfidence,
      trustScore: this.trustScore,
      observationHours: this.observationHours,
      successRate: this.successRate,
      totalActions: this.totalActions,
      successfulActions: this.successfulActions,
      domains: this.domains,
      savedAt: Date.now(),
    }))
  },

  scoreAction(actionType, context) {
    const domain = this.getDomain(actionType)
    const domainConf = this.domains[domain]?.confidence || 0
    const contextFamiliarity = this.assessContextFamiliarity(context)
    const riskScore = this.assessRisk(actionType, context)

    const score = (
      domainConf * 0.40 +
      this.trustScore * 0.30 +
      contextFamiliarity * 0.20 +
      (1 - riskScore) * 0.10
    )
    return Math.min(100, Math.max(0, score))
  },

  getDomain(actionType) {
    const map = {
      'create_file': 'file_management',
      'delete_file': 'file_management',
      'organize_files': 'file_management',
      'generate_code': 'code_generation',
      'refactor_code': 'code_generation',
      'search_web': 'research',
      'summarize': 'research',
      'create_folder': 'organization',
      'tag_files': 'organization',
      'send_message': 'communication',
      'draft_email': 'communication',
      'create_visual': 'creative',
      'generate_icon': 'creative',
    }
    return map[actionType] || 'file_management'
  },

  assessContextFamiliarity(context) {
    const store = useBodyStore.getState()
    const recent = store.agent.observations.slice(-100)
    const similar = recent.filter((o) =>
      JSON.stringify(o.data).includes(JSON.stringify(context).substring(0, 50))
    )
    return Math.min(1, similar.length / 10)
  },

  assessRisk(actionType, context) {
    let risk = 0.1
    if (actionType.includes('delete')) risk += 0.4
    if (actionType.includes('send')) risk += 0.3
    if (actionType.includes('install')) risk += 0.2
    if (context?.irreversible) risk += 0.3
    if (context?.external) risk += 0.2
    return Math.min(1, risk)
  },

  recordOutcome(actionType, success, userFeedback) {
    const domain = this.getDomain(actionType)
    const dom = this.domains[domain]
    dom.attempts++
    this.totalActions++

    if (success) {
      dom.successes++
      this.successfulActions++
      dom.confidence = Math.min(100, dom.confidence + 5)
    } else {
      dom.confidence = Math.max(0, dom.confidence - 10)
    }

    if (userFeedback === 'positive') {
      dom.confidence = Math.min(100, dom.confidence + 3)
    } else if (userFeedback === 'negative') {
      dom.confidence = Math.max(0, dom.confidence - 15)
    }

    this.successRate = this.totalActions > 0 ? this.successfulActions / this.totalActions : 0
    this.globalConfidence = Object.values(this.domains).reduce((sum, d) => sum + d.confidence, 0) / Object.keys(this.domains).length
    this.trustScore = (this.globalConfidence * 0.5) + (this.successRate * 100 * 0.3) + (Math.min(100, this.observationHours * 2) * 0.2)

    this.saveState()
    EventBus.emit('confidence:updated', { domain, success, newConfidence: dom.confidence, globalConfidence: this.globalConfidence })
  },

  decide(actionType, context, proposedAction) {
    const score = this.scoreAction(actionType, context)

    if (score < this.THRESHOLD_ASK * 100) {
      return { action: 'silence', score, reason: 'Too uncertain to suggest' }
    }
    if (score < this.THRESHOLD_SUGGEST * 100) {
      return { action: 'observe', score, reason: 'Still learning this domain' }
    }
    if (score < this.THRESHOLD_CONFIRM * 100) {
      return { action: 'suggest', score, reason: 'Suggesting but seeking confirmation', proposal: proposedAction }
    }
    return { action: 'act', score, reason: `High confidence (${score.toFixed(1)}%) — acting autonomously`, proposal: proposedAction }
  },

  observe(duration) {
    this.observationHours += duration / 3600000
    this.trustScore = Math.min(100, this.trustScore + (duration / 3600000) * 0.5)
    this.saveState()
  },

  startDecayTimer() {
    setInterval(() => {
      Object.keys(this.domains).forEach((key) => {
        const dom = this.domains[key]
        if (dom.attempts > 0 && dom.confidence > 10) {
          dom.confidence *= 0.999
        }
      })
      this.saveState()
    }, 60000)
  },

  getStatus() {
    return {
      globalConfidence: this.globalConfidence.toFixed(1),
      trustScore: this.trustScore.toFixed(1),
      observationHours: this.observationHours.toFixed(2),
      successRate: (this.successRate * 100).toFixed(1),
      totalActions: this.totalActions,
      phase: this.getPhase(),
      domains: Object.entries(this.domains).map(([name, data]) => ({
        name, confidence: data.confidence.toFixed(1), attempts: data.attempts,
      })),
    }
  },

  getPhase() {
    if (this.trustScore < 20) return 'OBSERVATION'
    if (this.trustScore < 50) return 'ASSISTED'
    if (this.trustScore < 70) return 'SUGGESTIVE'
    return 'AUTONOMOUS'
  },
}
