import React, { useState } from 'react'
import { useBodyStore } from '../../hooks/useBodyStore'
import { ConfidenceEngine } from '../../lib/ConfidenceEngine'

export default function AgentApp() {
  const agent = useBodyStore((state) => state.agent)
  const [activeTab, setActiveTab] = useState('status')

  const status = ConfidenceEngine.getStatus()

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex gap-1 border-b border-body-edge pb-2">
        {['status', 'studies', 'drift', 'observations'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`btn text-[10px] ${activeTab === tab ? 'btn-primary' : ''}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'status' && (
        <div className="flex-1 overflow-y-auto">
          <div className="mb-3 p-2 bg-body-deep rounded-md">
            <div className="text-xs font-semibold mb-2">Agent Status</div>
            <div className="text-[11px] text-text-secondary space-y-1">
              <div>Phase: {status.phase}</div>
              <div>Global Confidence: {status.globalConfidence}%</div>
              <div>Trust Score: {status.trustScore}%</div>
              <div>Observation Hours: {status.observationHours}h</div>
              <div>Success Rate: {status.successRate}%</div>
              <div>Total Actions: {status.totalActions}</div>
            </div>
          </div>
          <div className="p-2 bg-body-deep rounded-md">
            <div className="text-xs font-semibold mb-2">Domain Confidence</div>
            {status.domains?.map((d) => (
              <div key={d.name} className="flex justify-between text-[11px] mb-1">
                <span className="text-text-secondary">{d.name}</span>
                <span className="text-accent-neural">{d.confidence}% ({d.attempts})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'studies' && (
        <div className="flex-1 overflow-y-auto">
          {agent.studies.length === 0 ? (
            <div className="text-text-dim text-xs text-center py-5">No active studies</div>
          ) : (
            agent.studies.map((study) => (
              <div key={study.id} className="mb-2 p-2 bg-body-deep rounded-md text-[11px]">
                <div className="font-semibold">{study.hypothesis}</div>
                <div className="text-text-dim mt-1">Status: {study.status}</div>
                <div className="text-text-dim">Observations: {study.observations.length}</div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'drift' && (
        <div className="flex-1 overflow-y-auto">
          {agent.driftAlerts.length === 0 ? (
            <div className="text-text-dim text-xs text-center py-5">No drift detected</div>
          ) : (
            agent.driftAlerts.map((alert, i) => (
              <div key={i} className="mb-2 p-2 bg-body-deep rounded-md text-[11px]">
                <div className={`font-semibold ${alert.severity === 'high' ? 'text-red-500' : 'text-accent-neural'}`}>
                  {alert.type}
                </div>
                <div className="text-text-secondary mt-1">{alert.reason}</div>
                <div className="text-text-dim mt-1">{new Date(alert.timestamp).toLocaleTimeString()}</div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'observations' && (
        <div className="flex-1 overflow-y-auto">
          {agent.observations.length === 0 ? (
            <div className="text-text-dim text-xs text-center py-5">No observations yet</div>
          ) : (
            agent.observations.slice(-20).map((obs, i) => (
              <div key={i} className="mb-1 p-1.5 bg-body-deep rounded text-[10px]">
                <span className="text-accent-neural">{obs.event}</span>
                <span className="text-text-dim ml-2">{new Date(obs.timestamp).toLocaleTimeString()}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
