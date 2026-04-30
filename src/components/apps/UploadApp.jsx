import React, { useState, useCallback } from 'react'
import { useBodyStore } from '../../hooks/useBodyStore'
import { EventBus } from '../../lib/EventBus'

export default function UploadApp() {
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState('')

  const handleFiles = useCallback(async (fileList) => {
    if (!fileList || fileList.length === 0) return
    setUploading(true)
    setStatus(`Processing ${fileList.length} files...`)

    const store = useBodyStore.getState()
    let processed = 0

    for (const file of fileList) {
      try {
        const content = await file.text()
        store.addFile(file.name, content)
        processed++
        EventBus.emit('file:updated', { name: file.name, size: content.length })
      } catch (e) {
        console.error('Failed to read file:', file.name, e)
      }
    }

    setStatus(`✅ Processed ${processed} files`)
    setUploading(false)
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragOver(false)
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  const handleInputChange = useCallback(
    (e) => {
      handleFiles(e.target.files)
      e.target.value = ''
    },
    [handleFiles]
  )

  return (
    <div className="flex flex-col h-full gap-2">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-colors ${
          dragOver ? 'border-accent-neural bg-accent-neural/5' : 'border-body-edge bg-body-deep'
        }`}
      >
        <div className="text-3xl">📦</div>
        <div className="text-xs text-text-secondary text-center px-4">
          Drop files here or click to browse
        </div>
        <input
          type="file"
          multiple
          onChange={handleInputChange}
          className="hidden"
          id="file-input"
        />
        <label
          htmlFor="file-input"
          className="btn btn-primary cursor-pointer"
        >
          Browse Files
        </label>
      </div>
      {status && (
        <div className="text-xs p-2 bg-body-deep rounded-md">
          {uploading ? '⏳ ' : ''}{status}
        </div>
      )}
    </div>
  )
}
