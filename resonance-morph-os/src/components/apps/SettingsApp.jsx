import React, { useState } from 'react'
import { useBodyStore } from '../../hooks/useBodyStore'
import { EventBus } from '../../lib/EventBus'
import { ResonanceNetwork } from '../../lib/ResonanceNetwork'

export default function SettingsApp() {
  const store = useBodyStore.getState()
  const [githubToken, setGithubToken] = useState(store.githubToken || '')
  const [tridentUrl, setTridentUrl] = useState(store.tridentUrl || '')
  const [tridentKey, setTridentKey] = useState(store.tridentKey || '')
  const [supabaseUrl, setSupabaseUrl] = useState(store.supabaseUrl || '')
  const [supabaseKey, setSupabaseKey] = useState(store.supabaseKey || '')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    store.setSettings({
      githubToken,
      tridentUrl,
      tridentKey,
      supabaseUrl,
      supabaseKey,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    EventBus.emit('settings:saved', { timestamp: Date.now() })
  }

  const handleClearAll = () => {
    if (!confirm('Clear all stored data? This cannot be undone.')) return
    localStorage.clear()
    window.location.reload()
  }

  const handleExport = () => {
    const data = {
      files: store.files,
      installedApps: store.installedApps,
      chatHistory: store.chatHistory,
      agent: store.agent,
      morphKernel: store.morphKernel,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `resonance-backup-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="text-[11px] text-text-dim">System Settings</div>

      <div className="flex-1 overflow-y-auto space-y-3">
        <div className="p-2 bg-body-deep rounded-md">
          <div className="text-xs font-semibold mb-2">GitHub</div>
          <input
            type="password"
            value={githubToken}
            onChange={(e) => setGithubToken(e.target.value)}
            placeholder="GitHub Token"
            className="w-full bg-body-surface border border-body-edge rounded-md px-2.5 py-1.5 text-xs mb-2"
          />
        </div>

        <div className="p-2 bg-body-deep rounded-md">
          <div className="text-xs font-semibold mb-2">Trident AI</div>
          <input
            type="text"
            value={tridentUrl}
            onChange={(e) => setTridentUrl(e.target.value)}
            placeholder="Trident API URL"
            className="w-full bg-body-surface border border-body-edge rounded-md px-2.5 py-1.5 text-xs mb-2"
          />
          <input
            type="password"
            value={tridentKey}
            onChange={(e) => setTridentKey(e.target.value)}
            placeholder="Trident API Key"
            className="w-full bg-body-surface border border-body-edge rounded-md px-2.5 py-1.5 text-xs"
          />
        </div>

        <div className="p-2 bg-body-deep rounded-md">
          <div className="text-xs font-semibold mb-2">Supabase</div>
          <input
            type="text"
            value={supabaseUrl}
            onChange={(e) => setSupabaseUrl(e.target.value)}
            placeholder="Supabase URL"
            className="w-full bg-body-surface border border-body-edge rounded-md px-2.5 py-1.5 text-xs mb-2"
          />
          <input
            type="password"
            value={supabaseKey}
            onChange={(e) => setSupabaseKey(e.target.value)}
            placeholder="Supabase Anon Key"
            className="w-full bg-body-surface border border-body-edge rounded-md px-2.5 py-1.5 text-xs"
          />
        </div>

        <div className="p-2 bg-body-deep rounded-md">
          <div className="text-xs font-semibold mb-2">Network</div>
          <div className="text-[11px] text-text-secondary mb-2">
            Identity: {ResonanceNetwork.identity?.substring(0, 20)}...<br />
            Peers: {ResonanceNetwork.peers.size}
          </div>
          <div className="flex gap-2">
            <button onClick={() => ResonanceNetwork.setPreferredMode('p2p')} className="btn text-[10px]">P2P</button>
            <button onClick={() => ResonanceNetwork.setPreferredMode('p2b')} className="btn text-[10px]">P2B</button>
            <button onClick={() => ResonanceNetwork.setPreferredMode('b2b')} className="btn text-[10px]">B2B</button>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={handleSave} className="btn btn-primary">
          {saved ? '✅ Saved' : '💾 Save'}
        </button>
        <button onClick={handleExport} className="btn">📤 Export</button>
        <button onClick={handleClearAll} className="btn btn-danger">🗑️ Clear All</button>
      </div>
    </div>
  )
}
