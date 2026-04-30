import React, { useEffect, useRef, useState } from 'react'
import { useBodyStore } from '../hooks/useBodyStore'
import { EventBus } from '../lib/EventBus'
import Window from './Window'

export default function Desktop() {
  const windows = useBodyStore((state) => state.windows)
  const addWindow = useBodyStore((state) => state.addWindow)
  const removeWindow = useBodyStore((state) => state.removeWindow)
  const bringToFront = useBodyStore((state) => state.bringToFront)
  const desktopRef = useRef(null)

  useEffect(() => {
    const handleOpen = ({ appId }) => {
      // Check if already open and not minimized
      const existing = Object.entries(windows).find(([id, w]) => w.appId === appId && !w.minimized)
      if (existing) {
        bringToFront(existing[0])
        return
      }

      const id = `win_${appId}_${Date.now()}`
      const offset = Object.keys(windows).length * 25
      const isLarge = ['workspace', 'builder', 'network'].includes(appId)

      const newWindow = {
        id,
        appId,
        title: getAppTitle(appId),
        icon: getAppIcon(appId),
        x: 20 + offset,
        y: 40 + offset,
        width: isLarge ? 600 : 400,
        height: isLarge ? 500 : 500,
        zIndex: useBodyStore.getState().zIndex + 1,
        minimized: false,
        maximized: false,
      }

      addWindow(id, newWindow)
      EventBus.emit('app:opened', { appId, windowId: id })
    }

    EventBus.on('app:open', handleOpen)
    return () => EventBus.off('app:open', handleOpen)
  }, [windows, addWindow, bringToFront])

  const handleClose = (id) => {
    removeWindow(id)
  }

  const handleMinimize = (id) => {
    useBodyStore.setState((state) => ({
      windows: {
        ...state.windows,
        [id]: { ...state.windows[id], minimized: !state.windows[id].minimized },
      },
    }))
  }

  const handleMaximize = (id) => {
    const win = windows[id]
    if (!win) return

    useBodyStore.setState((state) => ({
      windows: {
        ...state.windows,
        [id]: {
          ...state.windows[id],
          maximized: !win.maximized,
          prevX: win.maximized ? undefined : win.x,
          prevY: win.maximized ? undefined : win.y,
          prevWidth: win.maximized ? undefined : win.width,
          prevHeight: win.maximized ? undefined : win.height,
          x: win.maximized ? (win.prevX || 20) : 0,
          y: win.maximized ? (win.prevY || 40) : 28,
          width: win.maximized ? (win.prevWidth || 400) : '100%',
          height: win.maximized ? (win.prevHeight || 500) : 'calc(100% - 84px)',
        },
      },
    }))
  }

  return (
    <div ref={desktopRef} className="flex-1 relative overflow-hidden">
      {Object.values(windows).map((win) => (
        <Window
          key={win.id}
          window={win}
          onClose={() => handleClose(win.id)}
          onMinimize={() => handleMinimize(win.id)}
          onMaximize={() => handleMaximize(win.id)}
          onFocus={() => bringToFront(win.id)}
        />
      ))}
    </div>
  )
}

function getAppTitle(appId) {
  const titles = {
    terminal: 'Terminal',
    files: 'Files',
    workspace: 'Workspace',
    builder: 'Builder',
    github: 'GitHub',
    agent: 'Agent',
    upload: 'Upload',
    body: 'Body Status',
    settings: 'Settings',
    network: 'Resonance Network',
  }
  return titles[appId] || appId
}

function getAppIcon(appId) {
  const icons = {
    terminal: '⌨️',
    files: '📁',
    workspace: '⬡',
    builder: '🎨',
    github: '🐙',
    agent: '🤖',
    upload: '⬆️',
    body: '🧬',
    settings: '⚙️',
    network: '🌐',
  }
  return icons[appId] || '✨'
}
