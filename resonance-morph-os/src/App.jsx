import React, { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import BodyShell from './components/BodyShell'
import { useBodyStore } from './hooks/useBodyStore'
import { MorphingSubstrate } from './lib/MorphingSubstrate'
import { BodyLifecycle } from './lib/BodyLifecycle'
import { Agent } from './lib/Agent'
import { SoundBody } from './lib/SoundBody'
import { ResonanceNetwork } from './lib/ResonanceNetwork'
import { ConfidenceEngine } from './lib/ConfidenceEngine'
import { RagSystem } from './lib/RagSystem'
import { DiscernmentEngine } from './lib/DiscernmentEngine'
import { SelfBuilder } from './lib/SelfBuilder'
import { ComplementaryEngine } from './lib/ComplementaryEngine'
import { AIIntegration } from './lib/AIIntegration'

function App() {
  const initBody = useBodyStore((state) => state.initBody)

  useEffect(() => {
    // Initialize all subsystems
    MorphingSubstrate.init()
    ConfidenceEngine.init()
    SelfBuilder.startBuildLoop()
    AIIntegration.init()
    SoundBody.init()
    ResonanceNetwork.init()
    ComplementaryEngine.init()

    // Start body lifecycle
    BodyLifecycle.start()

    // Initialize store
    initBody()

    // Welcome sequence
    setTimeout(() => {
      Agent.surface(
        `<strong>Observation mode active.</strong><br>I am learning your patterns. I will not act autonomously until my confidence reaches 70%.<br>Current phase: ${ConfidenceEngine.getPhase()}<br>Trust score: ${ConfidenceEngine.trustScore.toFixed(1)}%`,
        'observation'
      )
    }, 1500)

    // Cleanup
    return () => {
      BodyLifecycle.stop()
      ResonanceNetwork.destroy()
    }
  }, [initBody])

  return (
    <div className="w-full h-full bg-body-void text-white overflow-hidden">
      <Routes>
        <Route path="/*" element={<BodyShell />} />
      </Routes>
    </div>
  )
}

export default App
