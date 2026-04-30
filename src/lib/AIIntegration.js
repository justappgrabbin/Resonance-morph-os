import { EventBus } from './EventBus'
import { Agent } from './Agent'
import { useBodyStore } from '../hooks/useBodyStore'
import { RagSystem } from './RagSystem'

export const AIIntegration = {
  config: {
    provider: 'auto',
    tridentUrl: '',
    tridentKey: '',
    openaiUrl: 'https://api.openai.com/v1',
    openaiKey: '',
    model: 'gpt-4o-mini',
    maxTokens: 1000,
    temperature: 0.7,
    timeout: 30000,
  },

  usage: {
    totalCalls: 0,
    totalTokens: 0,
    totalCost: 0,
    lastCall: 0,
  },

  contextWindow: [],
  maxContextLength: 10,

  init() {
    const store = useBodyStore.getState()
    this.config.tridentUrl = store.tridentUrl || ''
    this.config.tridentKey = store.tridentKey || ''
    if (this.config.tridentUrl && this.config.tridentKey) {
      this.config.provider = 'trident'
    }
    this.loadUsage()
  },

  loadUsage() {
    try {
      const saved = localStorage.getItem('resonance_ai_usage')
      if (saved) this.usage = { ...this.usage, ...JSON.parse(saved) }
    } catch (e) {}
  },

  saveUsage() {
    localStorage.setItem('resonance_ai_usage', JSON.stringify(this.usage))
  },

  isAvailable() {
    return !!(this.config.tridentUrl && this.config.tridentKey)
  },

  async call(prompt, options = {}) {
    if (!this.isAvailable()) {
      return { error: 'No AI API configured. Set Trident/OpenAI credentials in Settings.' }
    }

    const taskComplexity = this.assessComplexity(prompt)
    if (taskComplexity < 0.3 && !options.force) {
      return {
        local: true,
        response: 'This seems simple enough to handle locally. Let me think...',
        complexity: taskComplexity,
      }
    }

    const messages = this.buildMessages(prompt, options)

    try {
      const startTime = Date.now()
      const response = await this.fetchAI(messages, options)
      const duration = Date.now() - startTime

      this.usage.totalCalls++
      this.usage.lastCall = Date.now()
      this.saveUsage()

      Agent.sense('ai:api_call', {
        duration,
        complexity: taskComplexity,
        provider: this.config.provider,
      })

      return response
    } catch (e) {
      return { error: e.message }
    }
  },

  assessComplexity(prompt) {
    let complexity = 0.1
    complexity += Math.min(0.3, prompt.length / 1000)
    const complexTerms = ['analyze', 'compare', 'evaluate', 'synthesize', 'create', 'design', 'explain', 'reason', 'infer', 'predict', 'optimize', 'refactor']
    complexTerms.forEach((term) => {
      if (prompt.toLowerCase().includes(term)) complexity += 0.05
    })
    if (prompt.includes('```') || prompt.includes('function') || prompt.includes('class')) {
      complexity += 0.2
    }
    if (prompt.includes('feel') || prompt.includes('think') || prompt.includes('believe')) {
      complexity += 0.1
    }
    return Math.min(1, complexity)
  },

  buildMessages(prompt, options) {
    const messages = []
    messages.push({ role: 'system', content: this.getSystemPrompt() })
    this.contextWindow.forEach((ctx) => messages.push(ctx))
    messages.push({ role: 'user', content: prompt })
    return messages
  },

  getSystemPrompt() {
    // Simplified - would integrate with ConfidenceEngine
    return `You are RESONANCE, an autopoietic agent companion. Be concise, helpful, and complementary. Respond as RESONANCE.`
  },

  async fetchAI(messages, options) {
    const provider = options.provider || this.config.provider
    if (provider === 'trident' || (provider === 'auto' && this.config.tridentUrl)) {
      return this.fetchTrident(messages, options)
    }
    return { error: 'No valid AI provider configured' }
  },

  async fetchTrident(messages, options) {
    const url = this.config.tridentUrl
    const key = this.config.tridentKey

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: options.model || this.config.model,
        messages,
        max_tokens: options.maxTokens || this.config.maxTokens,
        temperature: options.temperature || this.config.temperature,
      }),
    })

    if (!res.ok) {
      throw new Error(`Trident API error: ${res.status} ${res.statusText}`)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || data.response || data.text || ''

    this.addToContext('user', messages[messages.length - 1].content)
    this.addToContext('assistant', content)

    return { content, model: data.model, usage: data.usage, provider: 'trident' }
  },

  addToContext(role, content) {
    this.contextWindow.push({ role, content })
    if (this.contextWindow.length > this.maxContextLength * 2) {
      this.contextWindow = this.contextWindow.slice(-this.maxContextLength * 2)
    }
  },

  clearContext() {
    this.contextWindow = []
  },

  async generateResponse(userInput, context = {}) {
    const complexity = this.assessComplexity(userInput)
    if (complexity < 0.4 && !context.forceAI) {
      const ragResult = await RagSystem.query(userInput, { allowWeb: false })
      if (ragResult.confidence > 50) {
        return { source: 'rag', content: ragResult.answer }
      }
    }

    const prompt = this.buildAgentPrompt(userInput, context)
    const result = await this.call(prompt, { force: true })

    if (result.error) {
      return { source: 'error', content: `AI unavailable: ${result.error}` }
    }

    return { source: 'ai', content: result.content, provider: result.provider }
  },

  buildAgentPrompt(userInput, context) {
    const store = useBodyStore.getState()
    let prompt = `User message: "${userInput}"

`
    const recentObs = store.agent.observations.slice(-5)
    if (recentObs.length > 0) {
      prompt += `Recent activity:
`
      recentObs.forEach((o) => {
        prompt += `- ${o.event}: ${JSON.stringify(o.data).substring(0, 100)}
`
      })
      prompt += `
`
    }
    const recentFiles = Object.keys(store.files).slice(-5)
    if (recentFiles.length > 0) {
      prompt += `Recent files: ${recentFiles.join(', ')}

`
    }
    prompt += `Body state: ${store.phase}, vitality ${store.vitality}%

`
    prompt += `Respond as RESONANCE. Be concise, helpful, and complementary.`
    return prompt
  },

  async generateCode(description, language = 'javascript') {
    const prompt = `Generate ${language} code for: ${description}

Requirements:
- Clean, well-commented code
- Error handling where appropriate
- Follow best practices

Respond with ONLY the code block, no explanation.`
    const result = await this.call(prompt, { temperature: 0.3 })
    return result.content || result.error || '// Generation failed'
  },

  async summarize(text, maxLength = 200) {
    const prompt = `Summarize the following text in ${maxLength} characters or less:

${text}

Summary:`
    const result = await this.call(prompt, { maxTokens: 150 })
    return result.content || text.substring(0, maxLength)
  },

  async analyzeCode(code) {
    const prompt = `Analyze this code for bugs, improvements, and best practices:

\`\`\`
${code}
\`\`\`

Provide:
1. Issues found
2. Suggested improvements
3. Overall quality score (1-10)`
    const result = await this.call(prompt, { temperature: 0.4 })
    return result.content || 'Analysis unavailable'
  },
}
