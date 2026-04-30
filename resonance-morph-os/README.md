# RESONANCE — Autopoietic Body Operating System

A Netlify-ready full React application combining the Resonance Body OS and Morph OS Kernel into a unified autopoietic system.

## Features

- **Body Lifecycle**: Dormant → Observant → Active → Dreaming → Growing → Resonant
- **Morphing Substrate**: Ising model background with hexagram transitions (64 states)
- **Sound Body**: Generative audio, heartbeat, chimes, voice synthesis
- **Agent Companion**: Confidence-based autonomy, drift detection, studies
- **RAG System**: Local memory + web search (Wikipedia API)
- **Discernment Engine**: Evaluates ideas with relevance/timing/risk/alignment
- **Self-Builder**: Auto-scaffolds features based on observed needs
- **Resonance Network**: P2P/P2B/B2B peer discovery via BroadcastChannel + localStorage
- **GitHub Ingestion**: Pull repos into local memory
- **AI Integration**: Trident/OpenAI bridge with complexity assessment
- **File System**: Create, edit, delete files with persistence
- **Builder**: Generate HTML apps via AI, install them as new windows
- **Workspace**: Visual graph of file relationships
- **Network**: Peer discovery with elemental compatibility scoring

## Quick Start

```bash
npm install
npm run dev
```

## Deploy to Netlify

```bash
# Build
npm run build

# Or deploy directly
netlify deploy --prod --dir=dist
```

## Environment Variables (Netlify)

Set these in Netlify dashboard → Site settings → Environment variables:

- `VITE_TRIDENT_URL` — Your Trident AI API endpoint
- `VITE_TRIDENT_KEY` — Trident API key
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_KEY` — Supabase anon key
- `VITE_GITHUB_TOKEN` — GitHub personal access token

## Architecture

```
src/
  components/
    BodyShell.jsx       — Main layout (StatusBar + Desktop + Dock + AgentPanel + AppDrawer)
    StatusBar.jsx       — Phase indicator, time, agent status
    Dock.jsx            — App launcher with installed apps
    Desktop.jsx         — Window manager
    Window.jsx          — Draggable window frame
    AgentPanel.jsx      — Chat interface
    AppDrawer.jsx       — App grid
    apps/
      TerminalApp.jsx   — Python terminal (Pyodide)
      FilesApp.jsx      — File manager
      WorkspaceApp.jsx  — Visual graph workspace
      BuilderApp.jsx    — AI code generator
      GitHubApp.jsx     — Repo ingestion
      AgentApp.jsx      — Agent diagnostics
      UploadApp.jsx     — Drag-drop file upload
      BodyApp.jsx       — Body diagnostics
      SettingsApp.jsx   — System settings
      NetworkApp.jsx    — Peer network
      InstalledApp.jsx  — User-installed apps
  lib/
    EventBus.js         — Nervous system
    Agent.js            — Companion intelligence
    BodyLifecycle.js    — Phase transitions
    MorphingSubstrate.js — Ising model background
    SoundBody.js        — Generative audio
    ConfidenceEngine.js — Trust/confidence scoring
    RagSystem.js        — Retrieval augmented generation
    DiscernmentEngine.js — Idea evaluation
    SelfBuilder.js       — Auto-scaffolding
    ComplementaryEngine.js — Capability gap detection
    AIIntegration.js     — AI API bridge
    ResonanceNetwork.js  — P2P network
  hooks/
    useBodyStore.js     — Zustand state management
  styles/
    globals.css         — Tailwind + custom styles
```

## Morph Kernel Integration

The Morph OS Kernel is integrated through:
- `morphKernel` state in the store (artifacts, contracts, evolutionLog, gates, channels, consciousnessLevel)
- Terminal commands: `morph artifacts`, `morph contracts`, `morph gates`, `morph evolution`
- Builder app generates code that becomes morph artifacts
- GitHub ingestion creates contracts from repo structures

## License

MIT
