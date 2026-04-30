import React, { useState, useEffect } from 'react'
import { ResonanceNetwork } from '../../lib/ResonanceNetwork'
import { Agent } from '../../lib/Agent'

export default function NetworkApp() {
  const [peers, setPeers] = useState([])
  const [mode, setMode] = useState(ResonanceNetwork.preferredMode)
  const [message, setMessage] = useState('')
  const [selectedPeer, setSelectedPeer] = useState(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setPeers(Array.from(ResonanceNetwork.peers.values()))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSend = () => {
    if (!selectedPeer || !message.trim()) return
    const result = ResonanceNetwork.sendMessage(selectedPeer.identity, message, mode)
    if (result.status === 'sent') {
      Agent.surface(`📨 Sent to ${selectedPeer.identity.substring(0, 8)}...`, 'normal')
      setMessage('')
    }
  }

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex gap-2 items-center">
        <span className="text-[11px] text-text-dim">Mode:</span>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          className="bg-body-deep border border-body-edge rounded px-2 py-1 text-[11px]"
        >
          <option value="p2p">P2P (Human-to-Human)</option>
          <option value="p2b">P2B (Human-to-Agent)</option>
          <option value="b2b">B2B (Agent-to-Agent)</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto">
        {peers.length === 0 ? (
          <div className="text-text-dim text-xs text-center py-5">No peers discovered yet</div>
        ) : (
          peers.map((peer) => (
            <div
              key={peer.identity}
              onClick={() => setSelectedPeer(peer)}
              className={`p-2 mb-1 rounded-md cursor-pointer transition-colors ${
                selectedPeer?.identity === peer.identity ? 'bg-accent-neural/10 border border-accent-neural' : 'bg-body-deep hover:bg-body-raised'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${peer.compatibility.score > 0.7 ? 'bg-accent-assembly' : 'bg-text-dim'}`} />
                <span className="text-xs font-mono">{peer.identity.substring(0, 16)}...</span>
                <span className="flex-1" />
                <span className="text-[10px] text-text-dim">{peer.compatibility.percentage}%</span>
              </div>
              <div className="text-[10px] text-text-dim mt-1">
                {peer.compatibility.resonance} resonance | {peer.bodyState?.phase || 'unknown'} phase
              </div>
            </div>
          ))
        )}
      </div>

      {selectedPeer && (
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Message to ${selectedPeer.identity.substring(0, 8)}...`}
            className="flex-1 bg-body-deep border border-body-edge rounded-md px-2.5 py-1.5 text-xs"
          />
          <button onClick={handleSend} className="btn btn-primary">Send</button>
        </div>
      )}
    </div>
  )
}
