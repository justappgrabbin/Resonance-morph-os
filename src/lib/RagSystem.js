import { useBodyStore } from '../hooks/useBodyStore'

export const RagSystem = {
  localMemory: [],
  webCache: {},
  knowledgeGraph: {},

  async query(question, context = {}) {
    const localResults = this.searchLocalMemory(question)
    let webResults = []
    if (context.allowWeb !== false && localResults.length < 3) {
      webResults = await this.searchWeb(question)
    }
    const graphResults = this.queryKnowledgeGraph(question)
    const combined = this.rankAndCombine(localResults, webResults, graphResults)

    return {
      answer: this.synthesizeAnswer(question, combined),
      sources: combined.slice(0, 5),
      confidence: this.calculateRetrievalConfidence(combined),
    }
  },

  searchLocalMemory(query) {
    const terms = query.toLowerCase().split(/\s+/)
    const results = []
    const store = useBodyStore.getState()

    Object.entries(store.files).forEach(([name, content]) => {
      const score = this.scoreRelevance(terms, name + ' ' + content)
      if (score > 0.1) {
        results.push({ type: 'file', name, content: content.substring(0, 200), score })
      }
    })

    store.agent.observations.forEach((obs) => {
      const score = this.scoreRelevance(terms, JSON.stringify(obs.data))
      if (score > 0.1) {
        results.push({ type: 'observation', data: obs, score })
      }
    })

    store.agent.studies.forEach((study) => {
      const score = this.scoreRelevance(terms, study.hypothesis)
      if (score > 0.1) {
        results.push({ type: 'study', data: study, score })
      }
    })

    return results.sort((a, b) => b.score - a.score)
  },

  async searchWeb(query) {
    try {
      const cacheKey = query.toLowerCase().replace(/\W+/g, '_')
      if (this.webCache[cacheKey] && Date.now() - this.webCache[cacheKey].time < 3600000) {
        return this.webCache[cacheKey].results
      }

      const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.split(' ').slice(0, 3).join('_'))}`
      const res = await fetch(wikiUrl)
      if (res.ok) {
        const data = await res.json()
        const results = [{
          type: 'web',
          source: 'Wikipedia',
          title: data.title,
          content: data.extract,
          url: data.content_urls?.desktop?.page,
          score: 0.8,
        }]
        this.webCache[cacheKey] = { results, time: Date.now() }
        return results
      }
    } catch (e) {}
    return []
  },

  queryKnowledgeGraph(query) {
    const terms = query.toLowerCase().split(/\s+/)
    const results = []
    const store = useBodyStore.getState()

    Object.entries(store.agent.memoryGraph).forEach(([concept, connections]) => {
      const score = this.scoreRelevance(terms, concept + ' ' + JSON.stringify(connections))
      if (score > 0.1) {
        results.push({ type: 'graph', concept, connections, score })
      }
    })

    return results
  },

  scoreRelevance(terms, text) {
    if (!text) return 0
    const lower = text.toLowerCase()
    let matches = 0
    terms.forEach((term) => {
      if (lower.includes(term)) matches++
    })
    return matches / terms.length
  },

  rankAndCombine(local, web, graph) {
    const all = [...local, ...web, ...graph]
    return all.sort((a, b) => b.score - a.score)
  },

  synthesizeAnswer(question, sources) {
    if (sources.length === 0) return "I don't have enough information to answer that yet."
    const topSources = sources.slice(0, 3)
    let answer = 'Based on what I know:

'
    topSources.forEach((src, i) => {
      if (src.type === 'file') {
        answer += `${i + 1}. From your file "${src.name}": ${src.content.substring(0, 100)}...
`
      } else if (src.type === 'web') {
        answer += `${i + 1}. From ${src.source} (${src.title}): ${src.content?.substring(0, 100)}...
`
      } else if (src.type === 'observation') {
        answer += `${i + 1}. I observed: ${JSON.stringify(src.data.data).substring(0, 100)}
`
      }
    })
    return answer
  },

  calculateRetrievalConfidence(sources) {
    if (sources.length === 0) return 0
    const avgScore = sources.reduce((sum, s) => sum + s.score, 0) / sources.length
    return Math.min(100, avgScore * 100)
  },
}
