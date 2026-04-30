import { useBodyStore } from '../hooks/useBodyStore'

export const DiscernmentEngine = {
  evaluateIdea(idea, context) {
    const scores = {
      relevance: this.scoreRelevance(idea, context),
      timing: this.scoreTiming(idea, context),
      risk: this.scoreRisk(idea, context),
      alignment: this.scoreAlignment(idea, context),
      feasibility: this.scoreFeasibility(idea),
    }

    const overall = (
      scores.relevance * 0.30 +
      scores.timing * 0.20 +
      (1 - scores.risk) * 0.20 +
      scores.alignment * 0.20 +
      scores.feasibility * 0.10
    )

    return {
      isGoodIdea: overall > 0.6,
      confidence: overall * 100,
      scores,
      reasoning: this.generateReasoning(scores, overall),
    }
  },

  scoreRelevance(idea, context) {
    const store = useBodyStore.getState()
    const recentActivity = store.agent.observations.slice(-20)
    const activityText = recentActivity.map((o) => o.event).join(' ')
    const ideaTerms = idea.toLowerCase().split(/\s+/)
    let matches = 0
    ideaTerms.forEach((term) => {
      if (activityText.includes(term)) matches++
    })
    return Math.min(1, matches / Math.max(1, ideaTerms.length * 0.5))
  },

  scoreTiming(idea, context) {
    const store = useBodyStore.getState()
    const idle = Date.now() - store.lastActivity
    if (idle > 300000) return 0.9
    if (idle < 10000) return 0.3
    const recent = store.agent.observations.slice(-10)
    const rapidActions = recent.filter((o, i) => i > 0 && (o.timestamp - recent[i - 1].timestamp) < 2000).length
    if (rapidActions > 5) return 0.2
    return 0.7
  },

  scoreRisk(idea, context) {
    let risk = 0.1
    if (idea.includes('delete')) risk += 0.4
    if (idea.includes('overwrite')) risk += 0.3
    if (idea.includes('send')) risk += 0.3
    if (idea.includes('install')) risk += 0.2
    if (idea.includes('share')) risk += 0.25
    if (context?.irreversible) risk += 0.3
    if (context?.external) risk += 0.2
    return Math.min(1, risk)
  },

  scoreAlignment(idea, context) {
    const store = useBodyStore.getState()
    const successPatterns = store.agent.successLog
    const ideaLower = idea.toLowerCase()
    let aligned = 0
    successPatterns.forEach((pattern) => {
      if (pattern.type === 'interaction' && pattern.input && ideaLower.includes(pattern.input.toLowerCase())) {
        aligned++
      }
    })
    return Math.min(1, aligned / 5)
  },

  scoreFeasibility(idea) {
    if (idea.includes('web search') && !navigator.onLine) return 0.1
    const store = useBodyStore.getState()
    if (idea.includes('AI') && !store.tridentUrl) return 0.3
    if (idea.includes('file') && Object.keys(store.files).length === 0) return 0.5
    return 0.9
  },

  generateReasoning(scores, overall) {
    const parts = []
    if (scores.relevance > 0.7) parts.push('highly relevant to current activity')
    else if (scores.relevance < 0.3) parts.push('not clearly related to current activity')
    if (scores.timing > 0.7) parts.push('good timing')
    else if (scores.timing < 0.3) parts.push('poor timing')
    if (scores.risk > 0.5) parts.push('significant risk')
    else parts.push('low risk')
    return parts.join(', ')
  },
}
