import React, { useState } from 'react'
import { useBodyStore } from '../../hooks/useBodyStore'
import { EventBus } from '../../lib/EventBus'

export default function FilesApp() {
  const files = useBodyStore((state) => state.files)
  const currentFile = useBodyStore((state) => state.currentFile)
  const setCurrentFile = useBodyStore((state) => state.setCurrentFile)
  const addFile = useBodyStore((state) => state.addFile)
  const deleteFile = useBodyStore((state) => state.deleteFile)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editContent, setEditContent] = useState('')

  const handleSelect = (name) => {
    setCurrentFile(name)
    setEditName(name)
    setEditContent(files[name] || '')
    setEditing(true)
  }

  const handleSave = () => {
    if (!editName.trim()) return
    const store = useBodyStore.getState()
    if (currentFile && currentFile !== editName) {
      store.deleteFile(currentFile)
    }
    store.addFile(editName, editContent)
    setCurrentFile(editName)
    EventBus.emit('file:updated', { name: editName, size: editContent.length })
    setEditing(false)
  }

  const handleCreate = () => {
    const name = prompt('File name:', 'new_file.txt')
    if (!name) return
    if (files[name]) {
      alert('File already exists')
      return
    }
    addFile(name, '')
    handleSelect(name)
  }

  const handleDelete = () => {
    if (!currentFile) return
    if (!confirm(`Delete ${currentFile}?`)) return
    deleteFile(currentFile)
    setEditing(false)
    EventBus.emit('file:deleted', { name: currentFile })
  }

  const getFileIcon = (name) => {
    if (name.endsWith('.html')) return '📄'
    if (name.endsWith('.css')) return '🎨'
    if (name.endsWith('.js')) return '⚡'
    if (name.endsWith('.py')) return '🐍'
    return '📝'
  }

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex gap-2">
        <button onClick={handleCreate} className="btn">+ New File</button>
        <button onClick={handleDelete} className="btn btn-danger">🗑️ Delete</button>
      </div>
      <div className="flex-1 overflow-y-auto bg-body-deep rounded-md p-2">
        {Object.keys(files).length === 0 ? (
          <div className="text-text-dim text-xs text-center py-5">No files yet</div>
        ) : (
          Object.keys(files).sort().map((name) => (
            <div
              key={name}
              onClick={() => handleSelect(name)}
              className={`file-item ${currentFile === name ? 'selected' : ''}`}
            >
              <span>{getFileIcon(name)}</span>
              <span className="flex-1 overflow-hidden text-ellipsis">{name}</span>
              <span className="text-text-dim text-[10px]">{files[name].length}b</span>
            </div>
          ))
        )}
      </div>
      {editing && (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="bg-body-deep border border-body-edge rounded-md px-2.5 py-1.5 text-xs font-mono"
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="flex-1 min-h-[150px] bg-body-deep border border-body-edge rounded-md p-2 text-xs font-mono resize-y"
          />
          <div className="flex gap-2">
            <button onClick={handleSave} className="btn btn-primary">💾 Save</button>
            <button onClick={() => setEditing(false)} className="btn">✕ Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
