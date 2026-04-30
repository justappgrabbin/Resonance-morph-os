import { EventBus } from './EventBus'
import { Agent } from './Agent'
import { useBodyStore } from '../hooks/useBodyStore'

export const ComplementaryEngine = {
  userCapabilities: new Set(),
  userGaps: new Map(),

  init() {
    EventBus.on('app:opened', (data) => this.observeCapability(data.appId))
    EventBus.on('file:created', () => this.observeCapability('file:created'))
    EventBus.on('terminal:command', () => this.observeCapability('terminal:command'))

    setInterval(() => {
      const suggestion = this.suggestComplement()
      if (suggestion && Math.random() > 0.7) {
        Agent.surface(`💡 ${suggestion}`, 'proactive')
      }
    }, 120000)
  },

  observeCapability(event) {
    if (event.includes('file:')) this.userCapabilities.add('file_management')
    if (event.includes('terminal:')) this.userCapabilities.add('coding')
    if (event.includes('github:')) this.userCapabilities.add('research')
    if (event.includes('workspace:')) this.userCapabilities.add('visualization')
    if (event.includes('builder:')) this.userCapabilities.add('building')
  },

  identifyGaps() {
    const allCapabilities = ['file_management', 'coding', 'research', 'visualization', 'building', 'organization', 'communication']
    const gaps = allCapabilities.filter((c) => !this.userCapabilities.has(c))
    const store = useBodyStore.getState()
    const errors = store.agent.observations.filter((o) => o.event.includes('error'))
    if (errors.length > 5) gaps.push('error_handling')

    const recent = store.agent.observations.slice(-50)
    const eventCounts = {}
    recent.forEach((o) => { eventCounts[o.event] = (eventCounts[o.event] || 0) + 1 })
    Object.entries(eventCounts).forEach(([event, count]) => {
      if (count > 10) {
        this.userGaps.set('automation_' + event, count)
      }
    })

    return gaps
  },

  suggestComplement() {
    const gaps = this.identifyGaps()
    if (gaps.length === 0) return null
    const gap = gaps[0]
    const suggestions = {
      'file_management': 'I notice you work with files a lot. Want me to organize them automatically?',
      'coding': 'I can help write or refactor code. Just tell me what you need.',
      'research': 'I can search for information or summarize content for you.',
      'visualization': 'I can create visual representations of your data.',
      'building': 'I can help assemble components or scaffold new projects.',
      'organization': 'Your workspace is getting complex. Want me to suggest organization?',
      'communication': 'I can help draft messages or summarize conversations.',
      'error_handling': "I've noticed some friction. Want me to help debug?",
      'automation': "You've been doing that repeatedly. Want me to automate it?",
    }
    return suggestions[gap] || `I can help with ${gap}. Want me to?`
  },
}
