import React, { useEffect, useRef } from 'react'
import { useBodyStore } from '../../hooks/useBodyStore'
import { EventBus } from '../../lib/EventBus'

export default function WorkspaceApp() {
  const svgRef = useRef(null)
  const files = useBodyStore((state) => state.files)

  useEffect(() => {
    // Simple D3-like force simulation visualization
    const svg = svgRef.current
    if (!svg) return

    const width = svg.clientWidth || 400
    const height = svg.clientHeight || 300

    // Create nodes from files
    const nodes = Object.keys(files).map((name, i) => ({
      id: name,
      name: name.split('/').pop(),
      type: name.endsWith('.html') ? 'html' : name.endsWith('.css') ? 'css' : name.endsWith('.js') ? 'js' : 'other',
      x: width / 2 + (Math.random() - 0.5) * 200,
      y: height / 2 + (Math.random() - 0.5) * 200,
    }))

    // Simple force simulation
    const links = []
    nodes.forEach((source) => {
      const content = files[source.id] || ''
      nodes.forEach((target) => {
        if (source.id !== target.id && content.includes(target.name)) {
          links.push({ source: source.id, target: target.id })
        }
      })
    })

    // Render
    svg.innerHTML = ''
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    svg.appendChild(g)

    // Draw links
    links.forEach((link) => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      const s = nodes.find((n) => n.id === link.source)
      const t = nodes.find((n) => n.id === link.target)
      if (s && t) {
        line.setAttribute('x1', s.x)
        line.setAttribute('y1', s.y)
        line.setAttribute('x2', t.x)
        line.setAttribute('y2', t.y)
        line.setAttribute('stroke', 'var(--body-glow)')
        line.setAttribute('stroke-width', '1.5')
        line.setAttribute('opacity', '0.6')
        g.appendChild(line)
      }
    })

    // Draw nodes
    const colors = { html: '#f5c518', css: '#10d474', js: '#ff6b6b', other: '#8899aa' }
    nodes.forEach((node) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      circle.setAttribute('cx', node.x)
      circle.setAttribute('cy', node.y)
      circle.setAttribute('r', 20)
      circle.setAttribute('fill', colors[node.type] || colors.other)
      circle.setAttribute('opacity', '0.8')
      circle.setAttribute('stroke', 'var(--body-edge)')
      circle.setAttribute('stroke-width', '2')
      circle.style.cursor = 'pointer'
      g.appendChild(circle)

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      text.setAttribute('x', node.x)
      text.setAttribute('y', node.y + 35)
      text.setAttribute('text-anchor', 'middle')
      text.setAttribute('fill', 'var(--text-primary)')
      text.setAttribute('font-size', '10')
      text.textContent = node.name.substring(0, 15)
      g.appendChild(text)
    })
  }, [files])

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex gap-2 items-center">
        <button className="btn" onClick={() => EventBus.emit('workspace:ingest', { source: 'files' })}>📥 Ingest</button>
        <button className="btn" onClick={() => {}}>🧹 Clear</button>
        <span className="flex-1" />
        <span className="text-[11px] text-text-dim">Visual Assembly Workspace</span>
      </div>
      <div className="flex-1 bg-body-deep rounded-lg overflow-hidden">
        <svg ref={svgRef} width="100%" height="100%" className="bg-body-deep" />
      </div>
    </div>
  )
}
