import React, { useState, useEffect } from 'react'
import { useBodyStore } from '../../hooks/useBodyStore'
import { MorphingSubstrate } from '../../lib/MorphingSubstrate'

export default function BodyApp() {
  const phase = useBodyStore((state) => state.phase)
  const vitality = useBodyStore((state) => state.vitality)
  const organs = useBodyStore((state) => state.organs)
  const cycleCount = useBodyStore((state) => state.cycleCount)
  const [hexInfo, setHexInfo] = useState(MorphingSubstrate.getHexagramInfo())

  useEffect(() => {
    const interval = setInterval(() => {
      setHexInfo(MorphingSubstrate.getHexagramInfo())
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const phaseLabels = {
    dormant: 'Resting',
    observant: 'Watching',
    active: 'Engaged',
    dreaming: 'Processing',
    growing: 'Expanding',
    resonant: 'In Harmony',
  }

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="text-[11px] text-text-dim">Body Diagnostics</div>

      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 bg-body-deep rounded-md">
          <div className="text-[10px] text-text-dim">Phase</div>
          <div className="text-sm font-semibold text-accent-neural">{phaseLabels[phase] || phase}</div>
        </div>
        <div className="p-2 bg-body-deep rounded-md">
          <div className="text-[10px] text-text-dim">Vitality</div>
          <div className="text-sm font-semibold text-accent-assembly">{vitality}%</div>
        </div>
        <div className="p-2 bg-body-deep rounded-md">
          <div className="text-[10px] text-text-dim">Cycles</div>
          <div className="text-sm font-semibold">{cycleCount}</div>
        </div>
        <div className="p-2 bg-body-deep rounded-md">
          <div className="text-[10px] text-text-dim">Hexagram</div>
          <div className="text-sm font-semibold text-accent-agent">{hexInfo.current.split('—')[0]}</div>
        </div>
      </div>

      <div className="p-2 bg-body-deep rounded-md">
        <div className="text-[10px] text-text-dim mb-2">Organs</div>
        <div className="space-y-1">
          {Object.entries(organs).map(([id, organ]) => (
            <div key={id} className="flex items-center gap-2 text-[11px]">
              <div className={`w-1.5 h-1.5 rounded-full ${organ.active ? 'bg-accent-assembly' : 'bg-text-dim'}`} />
              <span className="flex-1 capitalize">{id}</span>
              <span className="text-text-dim">{organ.health}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-2 bg-body-deep rounded-md">
        <div className="text-[10px] text-text-dim mb-1">Current Hexagram</div>
        <div className="text-xs text-text-secondary">{hexInfo.current}</div>
        {hexInfo.transition > 0 && (
          <div className="text-[10px] text-text-dim mt-1">
            Transitioning to: {hexInfo.target} ({(hexInfo.transition * 100).toFixed(0)}%)
          </div>
        )}
        <div className="text-[10px] text-text-dim mt-1">
          T: {hexInfo.temperature} | J: {hexInfo.coupling}
        </div>
      </div>
    </div>
  )
}
