import React from 'react'
import { useBodyStore } from '../hooks/useBodyStore'
import { EventBus } from '../lib/EventBus'

const DRAWER_APPS = [
  { id: 'files', icon: '📁', label: 'Files' },
  { id: 'workspace', icon: '⬡', label: 'Workspace' },
  { id: 'builder', icon: '🎨', label: 'Builder' },
  { id: 'github', icon: '🐙', label: 'GitHub' },
  { id: 'upload', icon: '⬆️', label: 'Upload' },
  { id: 'network', icon: '🌐', label: 'Network' },
]

export default function AppDrawer({ open, onClose }) {
  const installedApps = useBodyStore((state) => state.installedApps)

  const handleOpen = (appId) => {
    EventBus.emit('app:open', { appId })
    onClose()
  }

  return (
    <div
      id="app-drawer"
      className={`fixed bottom-[calc(var(--dock-height)+8px)] left-1/2 -translate-x-1/2 w-[min(360px,calc(100vw-24px))] bg-body-surface/97 border border-body-edge rounded-2xl backdrop-blur-2xl z-[9996] transition-all duration-200 pb-2 ${
        open ? 'opacity-100 pointer-events-auto translate-y-0' : 'opacity-0 pointer-events-none translate-y-5'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3 pb-2 border-b border-body-edge">
        <span className="text-[11px] font-semibold tracking-wider text-text-secondary">APPS</span>
        <button onClick={onClose} className="cursor-pointer text-text-dim text-sm px-1.5 py-0.5 rounded hover:text-text-primary transition-colors">
          ✕
        </button>
      </div>
      <div className="grid grid-cols-4 gap-1 p-2.5 pb-1">
        {DRAWER_APPS.map((app) => (
          <div
            key={app.id}
            onClick={() => handleOpen(app.id)}
            className="flex flex-col items-center gap-1 p-2.5 rounded-xl cursor-pointer hover:bg-body-raised transition-colors"
          >
            <span className="text-2xl leading-none">{app.icon}</span>
            <span className="text-[10px] text-text-secondary text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[60px]">
              {app.label}
            </span>
          </div>
        ))}
      </div>
      {installedApps.length > 0 && (
        <div className="grid grid-cols-4 gap-1 px-2.5 pt-1.5 border-t border-body-edge">
          {installedApps.map((app) => (
            <div
              key={app.id}
              onClick={() => handleOpen(app.id)}
              className="flex flex-col items-center gap-1 p-2.5 rounded-xl cursor-pointer hover:bg-body-raised transition-colors"
            >
              <span className="text-2xl leading-none">{app.icon || '✨'}</span>
              <span className="text-[10px] text-text-secondary text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-[60px]">
                {app.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
