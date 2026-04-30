import React, { useState, useEffect, useCallback } from 'react'
import { useBodyStore } from '../hooks/useBodyStore'
import { EventBus } from '../lib/EventBus'
import { Agent } from '../lib/Agent'
import StatusBar from './StatusBar'
import Dock from './Dock'
import Desktop from './Desktop'
import AgentPanel from './AgentPanel'
import AppDrawer from './AppDrawer'

export default function BodyShell() {
  const phase = useBodyStore((state) => state.phase)
  const [agentPanelOpen, setAgentPanelOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((msg) => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, msg }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  useEffect(() => {
    const handleToast = (data) => addToast(data.msg || data)
    EventBus.on('toast', handleToast)
    return () => EventBus.off('toast', handleToast)
  }, [addToast])

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '9') {
        const apps = ['terminal', 'files', 'workspace', 'builder', 'github', 'agent', 'upload', 'body', 'settings']
        const idx = parseInt(e.key) - 1
        if (apps[idx]) {
          e.preventDefault()
          EventBus.emit('app:open', { appId: apps[idx] })
        }
      }
      if (e.key === 'Escape') {
        setAgentPanelOpen(false)
        setDrawerOpen(false)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (drawerOpen) {
        const drawer = document.getElementById('app-drawer')
        const btn = document.getElementById('drawer-btn')
        if (drawer && !drawer.contains(e.target) && e.target !== btn && !btn?.contains(e.target)) {
          setDrawerOpen(false)
        }
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [drawerOpen])

  const phaseClasses = {
    dormant: 'bg-body-void',
    observant: 'bg-body-void',
    active: 'bg-body-void',
    dreaming: 'bg-body-void',
    growing: 'bg-body-void',
    resonant: 'bg-body-void',
  }

  return (
    <div className={`w-full h-full flex flex-col relative ${phaseClasses[phase] || ''}`}>
      <StatusBar />
      <Desktop />
      <Dock
        onAgentToggle={() => setAgentPanelOpen(!agentPanelOpen)}
        onDrawerToggle={() => setDrawerOpen(!drawerOpen)}
        drawerOpen={drawerOpen}
      />
      <AgentPanel open={agentPanelOpen} onClose={() => setAgentPanelOpen(false)} />
      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {toasts.map((t) => (
        <div key={t.id} className="toast">
          {t.msg}
        </div>
      ))}
    </div>
  )
}
