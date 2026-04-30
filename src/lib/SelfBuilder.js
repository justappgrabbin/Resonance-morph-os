import { EventBus } from './EventBus'
import { Agent } from './Agent'
import { ConfidenceEngine } from './ConfidenceEngine'

export const SelfBuilder = {
  buildQueue: [],
  isBuilding: false,

  observeNeed(need) {
    if (!this.buildQueue.find((n) => n.type === need.type)) {
      this.buildQueue.push({
        type: need.type,
        description: need.description,
        observedAt: Date.now(),
        priority: need.priority || 0.5,
      })
    }
    this.buildQueue.sort((a, b) => b.priority - a.priority)
  },

  startBuildLoop() {
    setInterval(() => this.processQueue(), 30000)
  },

  async processQueue() {
    if (this.isBuilding || this.buildQueue.length === 0) return
    const need = this.buildQueue[0]
    const decision = ConfidenceEngine.decide('scaffold_feature', { featureType: need.type }, `Build ${need.description}`)

    if (decision.action === 'act') {
      this.isBuilding = true
      await this.buildFeature(need)
      this.buildQueue.shift()
      this.isBuilding = false
    } else if (decision.action === 'suggest') {
      Agent.surface(
        `🔧 <strong>Build suggestion:</strong> ${need.description}<br>` +
        `Confidence: ${decision.score.toFixed(0)}%<br>` +
        `<button onclick="SelfBuilder.confirmBuild('${need.type}')">Build it</button> ` +
        `<button onclick="SelfBuilder.rejectBuild('${need.type}')">Not now</button>`,
        'proactive'
      )
      this.buildQueue.shift()
    }
  },

  async buildFeature(need) {
    Agent.surface(`🔨 Building: ${need.description}...`, 'proactive')
    try {
      switch (need.type) {
        case 'file_template':
          await this.buildFileTemplate(need)
          break
        case 'shortcut':
          EventBus.emit('builder:shortcut_created', { description: need.description })
          break
        case 'automation':
          EventBus.emit('builder:automation_created', { description: need.description })
          break
        case 'visualization':
          EventBus.emit('builder:visualization_created', { description: need.description })
          break
        default:
          console.log('Unknown build type:', need.type)
      }
      ConfidenceEngine.recordOutcome('scaffold_feature', true, 'positive')
      Agent.surface(`✅ Built: ${need.description}`, 'proactive')
    } catch (e) {
      ConfidenceEngine.recordOutcome('scaffold_feature', false, 'negative')
      Agent.surface(`❌ Failed to build: ${need.description}`, 'proactive')
    }
  },

  async buildFileTemplate(need) {
    const template = `// Auto-generated template
// Created: ${new Date().toISOString()}
// Purpose: ${need.description}

`
    // Would save to store - simplified here
    console.log('Generated template:', template)
  },

  confirmBuild(type) {
    const need = this.buildQueue.find((n) => n.type === type) || { type, description: type }
    this.buildFeature(need)
  },

  rejectBuild(type) {
    ConfidenceEngine.recordOutcome('scaffold_feature', false, 'negative')
    Agent.surface("Okay, I'll hold off on that.", 'normal')
  },
}
