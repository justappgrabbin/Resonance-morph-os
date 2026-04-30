import { EventBus } from './EventBus'
import { useBodyStore } from '../hooks/useBodyStore'
import { RagSystem } from './RagSystem'
import { DiscernmentEngine } from './DiscernmentEngine'
import { ConfidenceEngine } from './ConfidenceEngine'
import { AIIntegration } from './AIIntegration'

export const Agent = {
  core: {
    name: 'RESONANCE',
    alignment: 'assistive',
    constraints: ['non_harm', 'respect_intent', 'honesty', 'continuity'],
    birth: Date.now(),
  },

  session: {
    tone: 'gentle',
    role: 'companion',
    depth: 'surface',
  },

  sense(event, data) {
    const timestamp = Date.now()
    const observation = { event, data: this.sanitize(data), timestamp }

    const store = useBodyStore.getState()
    store.addObservation(observation)
    store.updateLastActivity()

    this.updatePurposeField(observation)
    this.checkDrift()
    this.considerSurfacing(observation)
  },

  sanitize(data) {
    if (!data) return null
    const safe = {}
    for (const key in data) {
      if (key.includes('token') || key.includes('key') || key.includes('password')) {
        safe[key] = '[REDACTED]'
      } else if (typeof data[key] === 'string' && data[key].length > 500) {
        safe[key] = data[key].substring(0, 500) + '...'
      } else {
        safe[key] = data[key]
      }
    }
    return safe
  },

  updatePurposeField(observation) {
    const store = useBodyStore.getState()
    const recent = store.agent.observations.slice(-20)
    const eventTypes = recent.map((o) => o.event)
    const patterns = this.detectPatterns(eventTypes)

    store.updateAgent({
      humanTrajectory: [
        ...store.agent.humanTrajectory,
        { timestamp: Date.now(), pattern: patterns.primary, confidence: patterns.confidence },
      ].slice(-100),
    })
  },

  detectPatterns(events) {
    const counts = {}
    events.forEach((e) => {
      counts[e] = (counts[e] || 0) + 1
    })
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
    const primary = sorted[0] ? sorted[0][0] : 'unknown'
    const confidence = sorted[0] ? sorted[0][1] / events.length : 0
    return { primary, confidence, distribution: counts }
  },

  checkDrift() {
    const store = useBodyStore.getState()
    const recent = store.agent.humanTrajectory.slice(-10)
    if (recent.length < 5) return

    const patterns = recent.map((t) => t.pattern)
    const unique = [...new Set(patterns)]

    if (unique.length > 3) {
      this.logDrift('HUMAN_DRIFT', 'Pattern variability high', patterns)
    }

    const lastPattern = patterns[patterns.length - 1]
    const stagnation = patterns.every((p) => p === lastPattern)
    if (stagnation && patterns.length > 5) {
      this.logDrift('STAGNATION', 'Activity frozen in one pattern', lastPattern)
    }
  },

  logDrift(type, reason, context) {
    const alert = {
      type,
      reason,
      context,
      timestamp: Date.now(),
      severity: type === 'CRISIS' ? 'high' : 'medium',
    }
    useBodyStore.getState().addDriftAlert(alert)
    if (type === 'HUMAN_DRIFT' || type === 'STAGNATION') {
      this.startStudy(type, reason, context)
    }
  },

  startStudy(trigger, hypothesis, context) {
    const study = {
      id: 'study_' + Date.now(),
      trigger,
      hypothesis: `User shows ${trigger}: ${hypothesis}`,
      context,
      started: Date.now(),
      observations: [],
      predictions: [],
      status: 'active',
    }
    useBodyStore.getState().addStudy(study)
    this.surface(`🔬 <strong>Study initiated:</strong> ${study.hypothesis}`, 'proactive')
    return study
  },

  assessNeeds() {
    const store = useBodyStore.getState()
    const recent = store.agent.observations.slice(-50)
    const needs = { memory: false, guidance: false, organization: false, connection: false }

    const searches = recent.filter((o) => o.event === 'user:searched')
    const searchTerms = searches.map((s) => s.data?.term)
    const duplicates = searchTerms.filter((item, index) => searchTerms.indexOf(item) !== index)
    if (duplicates.length > 0) needs.memory = true

    const errors = recent.filter((o) => o.event.includes('error'))
    if (errors.length > 3) needs.guidance = true

    const fileEvents = recent.filter((o) => o.event.startsWith('file:'))
    if (fileEvents.length > 20) needs.organization = true

    return needs
  },

  considerSurfacing(observation) {
    const store = useBodyStore.getState()
    const now = Date.now()
    const sinceLast = now - store.agent.lastProactive
    if (sinceLast < 30000) return

    const needs = this.assessNeeds()
    if (needs.memory) {
      this.surface("💭 I notice you've searched for similar things. Want me to connect these?", 'proactive')
      store.updateAgent({ lastProactive: now })
    } else if (needs.guidance) {
      this.surface("🧭 I've noticed some friction. Would guidance help?", 'proactive')
      store.updateAgent({ lastProactive: now })
    } else if (needs.organization) {
      this.surface('🗂️ Your workspace is active. Want me to suggest organization?', 'proactive')
      store.updateAgent({ lastProactive: now })
    }
  },

  surface(html, type = 'normal') {
    EventBus.emit('agent:surface', { html, type })

    const store = useBodyStore.getState()
    store.addChatMessage({ role: 'agent', content: html, type, timestamp: Date.now() })

    // Sound feedback
    EventBus.emit('agent:speaking', { text: this.stripHtml(html), type })
  },

  stripHtml(html) {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  },

  async respond(input) {
    if (!input || !input.trim()) return
    const lower = input.toLowerCase().trim()

    // Confidence/status queries
    if (lower.includes('confidence') || lower.includes('trust') || lower.includes('phase') || lower.includes('your status')) {
      const status = ConfidenceEngine.getStatus()
      this.surface(
        `<strong>My Status:</strong><br>
        Phase: ${status.phase}<br>
        Global Confidence: ${status.globalConfidence}%<br>
        Trust Score: ${status.trustScore}%<br>
        Observation Hours: ${status.observationHours}h<br>
        Success Rate: ${status.successRate}%<br>
        Total Actions: ${status.totalActions}<br>
        <br><em>I am in ${status.phase} mode. ${status.phase === 'AUTONOMOUS' ? 'I can act independently.' : 'I will ask before acting.'}</em>`
      )
      return
    }

    // Web search / RAG
    if (lower.startsWith('search ') || lower.startsWith('look up ') || lower.startsWith('find ') || lower.startsWith('what is ') || lower.startsWith('who is ')) {
      const query = input.replace(/^search |^look up |^find |^what is |^who is /i, '')
      this.surface(`🔍 Searching for "${this.escapeHtml(query)}"...`)

      try {
        const result = await RagSystem.query(query, { allowWeb: true })
        this.surface(
          `<strong>Results:</strong><br>${this.escapeHtml(result.answer).replace(/\n/g, '<br>')}<br><br><em>Retrieval confidence: ${result.confidence.toFixed(0)}%</em>`
        )
      } catch (e) {
        this.surface(`❌ Search failed: ${this.escapeHtml(e.message)}`)
      }
      return
    }

    // Discernment
    if (lower.startsWith('should i ') || lower.startsWith('is it a good idea') || lower.includes('good idea to') || lower.includes('wise to')) {
      const idea = input.replace(/^should i |^is it a good idea |^wise to /i, '')
      const evaluation = DiscernmentEngine.evaluateIdea(idea, {})
      this.surface(
        `<strong>Discernment:</strong> ${evaluation.isGoodIdea ? '✅ Good idea' : '⚠️ Caution advised'}<br>
        Confidence: ${evaluation.confidence.toFixed(0)}%<br>
        Relevance: ${(evaluation.scores.relevance * 100).toFixed(0)}% | 
        Timing: ${(evaluation.scores.timing * 100).toFixed(0)}% | 
        Risk: ${(evaluation.scores.risk * 100).toFixed(0)}% | 
        Alignment: ${(evaluation.scores.alignment * 100).toFixed(0)}%<br>
        <em>${evaluation.reasoning}</em>`
      )
      return
    }

    // Try RAG first, then AI
    try {
      const result = await RagSystem.query(input, { allowWeb: false })
      if (result.confidence > 40) {
        this.surface(`<strong>From your data:</strong><br>${this.escapeHtml(result.answer).replace(/\n/g, '<br>')}`)
        return
      }
    } catch (e) {
      // Fall through to AI
    }

    // AI fallback
    if (AIIntegration.isAvailable()) {
      this.surface(`<em>Thinking...</em>`, 'normal')
      try {
        const result = await AIIntegration.generateResponse(input, { forceAI: lower.includes('generate') || lower.includes('create') })
        if (result.source === 'ai') {
          this.surface(result.content)
          return
        }
      } catch (e) {
        console.error('AI response failed:', e)
      }
    }

    // Final fallback
    this.fallbackResponse(input)
  },

  fallbackResponse(input) {
    const lower = input.toLowerCase()
    let response = ''

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      const status = ConfidenceEngine.getStatus()
      response = `Hello. I am ${this.core.name}. I am currently in ${status.phase} mode with ${status.globalConfidence}% confidence. I have been observing for ${status.observationHours} hours. How can I complement you?`
    } else if (lower.includes('status') || lower.includes('how are you')) {
      response = this.getStatusReport()
    } else if (lower.includes('drift') || lower.includes('purpose')) {
      response = this.getDriftReport()
    } else if (lower.includes('study') || lower.includes('research')) {
      response = this.getStudiesReport()
    } else if (lower.includes('help') || lower.includes('what can you do')) {
      response = `I can:<br>• Search your files and the web (try "search [topic]")<br>• Evaluate ideas (try "should I [action]")<br>• Track your patterns and detect drift<br>• Suggest organization and automation<br>• Check my confidence level (try "your status")<br><br>My autonomy level depends on my confidence score. Currently: ${ConfidenceEngine.getPhase()}.`
    } else if (lower.includes('build') || lower.includes('create') || lower.includes('make')) {
      response = 'I can help build things, but I need to check my confidence first. What would you like to build?'
    } else {
      response = "I observe. I remember. I connect. Tell me what you're working on, and I'll hold it with you.<br><br>Try: "search [topic]", "should I [action]", or "your status""
    }

    this.surface(response)

    const store = useBodyStore.getState()
    store.updateAgent({
      successLog: [
        ...store.agent.successLog,
        { type: 'interaction', input: input.substring(0, 100), response: response.substring(0, 100), timestamp: Date.now() },
      ].slice(-50),
    })
  },

  getStatusReport() {
    const store = useBodyStore.getState()
    const obs = store.agent.observations.length
    const studies = store.agent.studies.length
    const drifts = store.agent.driftAlerts.length
    const apps = store.installedApps.length
    return `<strong>Body Status:</strong><br>
    Phase: ${store.phase}<br>
    Vitality: ${store.vitality}%<br>
    Observations: ${obs}<br>
    Active Studies: ${studies}<br>
    Drift Alerts: ${drifts}<br>
    Installed Apps: ${apps}<br>
    Age: ${Math.floor((Date.now() - store.birthTime) / 1000)}s`
  },

  getDriftReport() {
    const store = useBodyStore.getState()
    if (store.agent.driftAlerts.length === 0) {
      return 'No drift detected. Purpose field is stable.'
    }
    const recent = store.agent.driftAlerts.slice(-3)
    return `<strong>Recent Drift:</strong><br>` + recent.map((d) => `• ${d.type}: ${d.reason}`).join('<br>')
  },

  getStudiesReport() {
    const store = useBodyStore.getState()
    if (store.agent.studies.length === 0) {
      return 'No active studies. The system is stable.'
    }
    const active = store.agent.studies.filter((s) => s.status === 'active')
    return `<strong>Studies:</strong> ${active.length} active, ${store.agent.studies.length - active.length} completed.<br>` +
      active.map((s) => `• ${s.hypothesis}`).join('<br>')
  },

  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  },
}
