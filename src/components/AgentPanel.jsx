import React, { useRef, useEffect, useState } from 'react'
import { useBodyStore } from '../hooks/useBodyStore'
import { EventBus } from '../lib/EventBus'
import { Agent } from '../lib/Agent'

export default function AgentPanel({ open, onClose }) {
  const messages = useBodyStore((state) => state.chatHistory)
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    const handleSurface = ({ html, type }) => {
      // Messages are already added to store by Agent.surface
    }
    EventBus.on('agent:surface', handleSurface)
    return () => EventBus.off('agent:surface', handleSurface)
  }, [])

  const handleSend = () => {
    if (!input.trim()) return
    const store = useBodyStore.getState()
    store.addChatMessage({ role: 'user', content: input, timestamp: Date.now() })
    Agent.respond(input)
    setInput('')
  }

  return (
    <div
      id="agent-panel"
      className={`fixed bottom-[calc(var(--dock-height)+8px)] right-3 w-80 max-h-[420px] bg-body-surface/95 border border-body-edge rounded-xl backdrop-blur-xl flex flex-col z-[9997] transition-all duration-300 ${
        open ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-[calc(100%+var(--dock-height)+20px)] opacity-0 pointer-events-none'
      }`}
    >
      <div
        className="p-2.5 border-b border-body-edge flex items-center gap-2 cursor-pointer"
        onClick={onClose}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-accent-agent shadow-[0_0_6px_var(--accent-agent)]" />
        <span className="text-[11px] font-semibold">RESONANCE</span>
        <span className="flex-1" />
        <span className="text-[10px] text-text-dim">observing</span>
        <span className={`text-[10px] text-text-dim transition-transform duration-300 ${open ? 'rotate-180' : ''}`}>▲</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 text-xs leading-relaxed scrollbar">
        {messages.length === 0 && (
          <div className="agent-message">
            <strong>Body initialized.</strong><br />
            I am the substrate. I hold space for what you create.
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`agent-message ${msg.type || ''}`}>
            {msg.role === 'user' ? (
              <><strong>You:</strong> {msg.content}</>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: msg.content }} />
            )}
          </div>
        ))}
      </div>
      <div className="p-2 border-t border-body-edge">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Speak to the body..."
            className="flex-1 bg-body-deep border border-body-edge rounded-md px-2.5 py-1.5 text-xs text-text-primary outline-none focus:border-accent-neural"
          />
          <button onClick={handleSend} className="btn btn-primary text-xs px-3">
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
