import React, { useRef, useState, useEffect, useCallback } from 'react'
import TerminalApp from './apps/TerminalApp'
import FilesApp from './apps/FilesApp'
import WorkspaceApp from './apps/WorkspaceApp'
import BuilderApp from './apps/BuilderApp'
import GitHubApp from './apps/GitHubApp'
import AgentApp from './apps/AgentApp'
import UploadApp from './apps/UploadApp'
import BodyApp from './apps/BodyApp'
import SettingsApp from './apps/SettingsApp'
import NetworkApp from './apps/NetworkApp'
import InstalledApp from './apps/InstalledApp'

const APP_COMPONENTS = {
  terminal: TerminalApp,
  files: FilesApp,
  workspace: WorkspaceApp,
  builder: BuilderApp,
  github: GitHubApp,
  agent: AgentApp,
  upload: UploadApp,
  body: BodyApp,
  settings: SettingsApp,
  network: NetworkApp,
}

export default function Window({ window: win, onClose, onMinimize, onMaximize, onFocus }) {
  const ref = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e) => {
    if (e.target.closest('.win-btn')) return
    onFocus()
    if (win.maximized) return
    setDragging(true)
    setDragOffset({
      x: e.clientX - win.x,
      y: e.clientY - win.y,
    })
  }

  const handleMouseMove = useCallback(
    (e) => {
      if (!dragging) return
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      // Update position via store
      // Simplified - would need proper store update
    },
    [dragging, dragOffset]
  )

  const handleMouseUp = useCallback(() => {
    setDragging(false)
  }, [])

  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, handleMouseMove, handleMouseUp])

  const AppComponent = APP_COMPONENTS[win.appId] || InstalledApp

  return (
    <div
      ref={ref}
      className={`window ${win.minimized ? 'minimized' : ''}`}
      style={{
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
        zIndex: win.zIndex,
      }}
    >
      <div
        className="window-header"
        onMouseDown={handleMouseDown}
      >
        <div className="flex-1 text-xs font-semibold text-text-primary overflow-hidden text-ellipsis whitespace-nowrap">
          {win.icon} {win.title}
        </div>
        <button
          className="w-3 h-3 rounded-full border-none cursor-pointer hover:scale-125 transition-transform bg-accent-neural"
          onClick={onMinimize}
          title="Minimize"
        />
        <button
          className="w-3 h-3 rounded-full border-none cursor-pointer hover:scale-125 transition-transform bg-accent-assembly"
          onClick={onMaximize}
          title="Maximize"
        />
        <button
          className="w-3 h-3 rounded-full border-none cursor-pointer hover:scale-125 transition-transform bg-accent-runbox"
          onClick={onClose}
          title="Close"
        />
      </div>
      <div className="win-body scrollbar">
        <AppComponent windowId={win.id} appId={win.appId} />
      </div>
    </div>
  )
}
