import React from 'react'
import { useBodyStore } from '../../hooks/useBodyStore'

export default function InstalledApp({ appId }) {
  const installedApps = useBodyStore((state) => state.installedApps)
  const app = installedApps.find((a) => a.id === appId)

  if (!app) {
    return <div className="text-text-dim text-xs">App not found</div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="text-xs font-semibold mb-2">{app.icon} {app.name}</div>
      <div className="flex-1 bg-body-deep rounded-md overflow-hidden">
        <iframe
          srcDoc={app.code}
          className="w-full h-full border-none"
          sandbox="allow-scripts"
        />
      </div>
    </div>
  )
}
