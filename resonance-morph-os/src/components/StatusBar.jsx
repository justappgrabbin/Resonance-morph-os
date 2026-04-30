import React, { useState, useEffect } from 'react'
import { useBodyStore } from '../hooks/useBodyStore'

export default function StatusBar() {
  const phase = useBodyStore((state) => state.phase)
  const vitality = useBodyStore((state) => state.vitality)
  const agentAwake = useBodyStore((state) => state.agent.awake)
  const [time, setTime] = useState('00:00')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }
    update()
    const timer = setInterval(update, 60000)
    return () => clearInterval(timer)
  }, [])

  const pulseColors = {
    dormant: 'bg-vitality-dormant',
    observant: 'bg-vitality-observant',
    active: 'bg-vitality-active',
    dreaming: 'bg-vitality-dreaming',
    growing: 'bg-vitality-growing',
    resonant: 'bg-vitality-resonant',
  }

  return (
    <div className="h-7 bg-body-deep/90 border-b border-body-edge flex items-center px-3 gap-3 text-[11px] z-[9999] backdrop-blur-md">
      <div className={`w-2 h-2 rounded-full ${pulseColors[phase]} relative`}>
        <div className={`absolute inset-[-3px] rounded-full border border-current opacity-30 animate-pulse-ring`} />
      </div>
      <div className="text-text-secondary uppercase tracking-wider text-[10px]">{phase}</div>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5 cursor-pointer px-2 py-0.5 rounded hover:bg-white/5 transition-colors">
        <div className={`w-1.5 h-1.5 rounded-full ${agentAwake ? 'bg-accent-agent shadow-[0_0_6px_var(--accent-agent)]' : 'bg-text-dim'}`} />
        <span className="text-text-secondary text-[10px]">RESONANCE</span>
      </div>
      <div className="text-text-dim font-mono text-[10px]">{time}</div>
    </div>
  )
}
