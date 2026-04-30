import React, { useState } from 'react'
import { useBodyStore } from '../../hooks/useBodyStore'
import { EventBus } from '../../lib/EventBus'
import { AIIntegration } from '../../lib/AIIntegration'

export default function BuilderApp() {
  const [description, setDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const [preview, setPreview] = useState('')
  const installedApps = useBodyStore((state) => state.installedApps)
  const addInstalledApp = useBodyStore((state) => state.addInstalledApp)

  const handleGenerate = async () => {
    if (!description.trim()) return
    setGenerating(true)
    try {
      const code = await AIIntegration.generateCode(description, 'html')
      setPreview(code)
      EventBus.emit('builder:generated', { description, code })
    } catch (e) {
      setPreview(`<!-- Error: ${e.message} -->`)
    }
    setGenerating(false)
  }

  const handleInstall = () => {
    if (!preview) return
    const app = {
      id: `app_${Date.now()}`,
      name: description.substring(0, 30) || 'Generated App',
      icon: '📦',
      code: preview,
      installedAt: Date.now(),
    }
    addInstalledApp(app)
    EventBus.emit('app:installed', { app })
    setDescription('')
    setPreview('')
  }

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="text-[11px] text-text-dim mb-1">Describe what you want to build:</div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="e.g., A color picker with hex input and preview..."
        className="h-20 bg-body-deep border border-body-edge rounded-md p-2 text-xs resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className={`btn btn-primary ${generating ? 'opacity-50' : ''}`}
        >
          {generating ? '⚙️ Generating...' : '✨ Generate'}
        </button>
        {preview && (
          <button onClick={handleInstall} className="btn">
            📦 Install
          </button>
        )}
      </div>
      {preview && (
        <div className="flex-1 bg-body-deep border border-body-edge rounded-md overflow-hidden">
          <iframe
            srcDoc={preview}
            className="w-full h-full border-none"
            sandbox="allow-scripts"
          />
        </div>
      )}
      {installedApps.length > 0 && (
        <div className="mt-2">
          <div className="text-[11px] text-text-dim mb-1">Installed Apps ({installedApps.length}):</div>
          <div className="flex flex-wrap gap-1">
            {installedApps.map((app) => (
              <span key={app.id} className="px-2 py-1 bg-body-raised rounded text-[10px]">
                {app.icon} {app.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
