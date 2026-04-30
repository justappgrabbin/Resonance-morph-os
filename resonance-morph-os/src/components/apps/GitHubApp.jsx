import React, { useState } from 'react'
import { useBodyStore } from '../../hooks/useBodyStore'
import { EventBus } from '../../lib/EventBus'

export default function GitHubApp() {
  const [repoUrl, setRepoUrl] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const githubToken = useBodyStore((state) => state.githubToken)

  const handleIngest = async () => {
    if (!repoUrl.trim()) return
    setLoading(true)
    setStatus('Parsing repository...')

    try {
      // Parse GitHub URL
      const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/)
      if (!match) {
        setStatus('Invalid GitHub URL')
        setLoading(false)
        return
      }
      const [, owner, repo] = match

      setStatus(`Fetching ${owner}/${repo}...`)

      // Fetch repo contents via GitHub API
      const headers = {}
      if (githubToken) headers['Authorization'] = `token ${githubToken}`

      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/`, { headers })
      if (!res.ok) throw new Error(`GitHub API: ${res.status}`)

      const contents = await res.json()
      const files = {}

      // Fetch each file
      for (const item of contents) {
        if (item.type === 'file' && item.size < 50000) {
          setStatus(`Fetching ${item.name}...`)
          const fileRes = await fetch(item.download_url)
          if (fileRes.ok) {
            const content = await fileRes.text()
            files[item.name] = content
          }
        }
      }

      // Add to store
      const store = useBodyStore.getState()
      Object.entries(files).forEach(([name, content]) => {
        store.addFile(`${repo}/${name}`, content)
      })

      EventBus.emit('github:ingested', { repo, files: Object.keys(files) })
      setStatus(`✅ Ingested ${Object.keys(files).length} files from ${repo}`)
    } catch (e) {
      setStatus(`❌ Error: ${e.message}`)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="text-[11px] text-text-dim">Enter GitHub repository URL:</div>
      <div className="flex gap-2">
        <input
          type="text"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/user/repo"
          className="flex-1 bg-body-deep border border-body-edge rounded-md px-2.5 py-1.5 text-xs"
        />
        <button
          onClick={handleIngest}
          disabled={loading}
          className={`btn btn-primary ${loading ? 'opacity-50' : ''}`}
        >
          {loading ? '⏳' : '📥 Ingest'}
        </button>
      </div>
      {status && (
        <div className="text-xs p-2 bg-body-deep rounded-md">
          {status}
        </div>
      )}
      <div className="flex-1 overflow-y-auto bg-body-deep rounded-md p-2">
        <div className="text-[10px] text-text-dim mb-2">Ingested Repositories:</div>
      </div>
    </div>
  )
}
