import React from 'react'
import { useBodyStore } from '../hooks/useBodyStore'
import { EventBus } from '../lib/EventBus'

const DOCK_APPS = [
  { id: 'terminal', icon: '⌨️', title: 'Terminal' },
  { id: 'agent', icon: '🤖', title: 'Agent' },
  { id: 'drawer', icon: '⊞', title: 'All Apps', isDrawer: true },
  { id: 'body', icon: '🧬', title: 'Body Status' },
  { id: 'settings', icon: '⚙️', title: 'Settings' },
]

export default function Dock({ onAgentToggle, onDrawerToggle, drawerOpen }) {
  const windows = useBodyStore((state) => state.windows)
  const installedApps = useBodyStore((state) => state.installedApps)

  const isAppActive = (appId) => {
    return Object.values(windows).some((w) => w.appId === appId && !w.minimized)
  }

  const handleClick = (app) => {
    if (app.isDrawer) {
      onDrawerToggle()
    } else if (app.id === 'agent') {
      onAgentToggle()
    } else {
      EventBus.emit('app:open', { appId: app.id })
    }
  }

  return (
    <div className="h-[var(--dock-height)] bg-body-deep/95 border-t border-body-edge flex items-center justify-center gap-2 px-4 z-[9998] backdrop-blur-xl overflow-x-auto scrollbar-hide">
      {DOCK_APPS.map((app) => (
        <button
          key={app.id}
          onClick={() => handleClick(app)}
          className={`dock-btn ${isAppActive(app.id) ? 'active' : ''} ${app.isDrawer && drawerOpen ? 'bg-accent-neural/20 border-accent-neural shadow-[0_0_12px_rgba(245,197,24,0.25)]' : ''}`}
          title={app.title}
        >
          <span>{app.icon}</span>
        </button>
      ))}

      {installedApps.length > 0 && (
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-body-edge">
          {installedApps.slice(0, 3).map((app) => (
            <button
              key={app.id}
              onClick={() => EventBus.emit('app:open', { appId: app.id })}
              className={`dock-btn ${isAppActive(app.id) ? 'active' : ''}`}
              title={app.name}
            >
              <span>{app.icon || '✨'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
