import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useBodyStore = create(
  persist(
    (set, get) => ({
      // Body state
      vitality: 15,
      phase: 'dormant',
      breath: 'inhale',
      mood: 'still',
      lastActivity: Date.now(),
      birthTime: Date.now(),
      cycleCount: 0,
      integrity: 100,
      growth: 0,
      resonance: 0,

      // Organs
      organs: {
        terminal: { active: false, health: 100, load: 0 },
        files: { active: false, health: 100, load: 0 },
        workspace: { active: false, health: 100, load: 0 },
        builder: { active: false, health: 100, load: 0 },
        github: { active: false, health: 100, load: 0 },
        agent: { active: false, health: 100, load: 0 },
        upload: { active: false, health: 100, load: 0 },
        body: { active: false, health: 100, load: 0 },
        settings: { active: false, health: 100, load: 0 },
        network: { active: false, health: 100, load: 0 },
      },

      // Windows
      windows: {},
      zIndex: 100,

      // Files
      files: {
        'welcome.txt': `Welcome to RESONANCE

This is your autopoietic body.

Organs:
- Terminal: Python execution
- Files: Living memory
- Workspace: Visual graph
- Builder: Component assembly
- GitHub: External ingestion
- Agent: Companion intelligence
- Body: Self-diagnostics
- Network: Federated communication

Everything persists. Everything grows.`,
      },
      currentFile: null,

      // Apps
      installedApps: [],

      // Settings
      githubToken: '',
      tridentUrl: '',
      tridentKey: '',
      supabaseUrl: '',
      supabaseKey: '',

      // Chat
      chatHistory: [],

      // Agent
      agent: {
        awake: false,
        phase: 'dormant',
        purposeVector: { x: 0, y: 0 },
        humanTrajectory: [],
        agentTrajectory: [],
        driftAlerts: [],
        observations: [],
        studies: [],
        papers: [],
        successLog: [],
        memoryGraph: {},
        lastProactive: 0,
        sessionStart: Date.now(),
      },

      // Morph Kernel integration
      morphKernel: {
        artifacts: {},
        contracts: {},
        evolutionLog: [],
        activeGates: new Set(),
        activeChannels: new Set(),
        consciousnessLevel: 0,
      },

      // Actions
      setPhase: (phase) => set({ phase }),
      setVitality: (vitality) => set({ vitality }),
      updateLastActivity: () => set({ lastActivity: Date.now() }),
      incrementCycle: () => set((s) => ({ cycleCount: s.cycleCount + 1 })),

      setOrganActive: (organId, active) =>
        set((s) => ({
          organs: {
            ...s.organs,
            [organId]: { ...s.organs[organId], active },
          },
        })),

      addWindow: (id, win) =>
        set((s) => ({
          windows: { ...s.windows, [id]: win },
          zIndex: s.zIndex + 1,
        })),

      removeWindow: (id) =>
        set((s) => {
          const { [id]: _, ...rest } = s.windows
          return { windows: rest }
        }),

      bringToFront: (id) =>
        set((s) => ({
          windows: {
            ...s.windows,
            [id]: { ...s.windows[id], zIndex: s.zIndex + 1 },
          },
          zIndex: s.zIndex + 1,
        })),

      setFiles: (files) => set({ files }),
      setCurrentFile: (currentFile) => set({ currentFile }),

      addFile: (name, content) =>
        set((s) => ({
          files: { ...s.files, [name]: content },
        })),

      deleteFile: (name) =>
        set((s) => {
          const { [name]: _, ...rest } = s.files
          return { files: rest, currentFile: s.currentFile === name ? null : s.currentFile }
        }),

      setInstalledApps: (installedApps) => set({ installedApps }),

      addInstalledApp: (app) =>
        set((s) => ({
          installedApps: [...s.installedApps, app],
        })),

      removeInstalledApp: (appId) =>
        set((s) => ({
          installedApps: s.installedApps.filter((a) => a.id !== appId),
        })),

      updateApp: (appId, updates) =>
        set((s) => ({
          installedApps: s.installedApps.map((a) =>
            a.id === appId ? { ...a, ...updates } : a
          ),
        })),

      setSettings: (settings) => set(settings),

      addChatMessage: (msg) =>
        set((s) => ({
          chatHistory: [...s.chatHistory, msg],
        })),

      updateAgent: (updates) =>
        set((s) => ({
          agent: { ...s.agent, ...updates },
        })),

      addObservation: (obs) =>
        set((s) => {
          const observations = [...s.agent.observations, obs]
          if (observations.length > 1000) observations.shift()
          return { agent: { ...s.agent, observations } }
        }),

      addStudy: (study) =>
        set((s) => ({
          agent: { ...s.agent, studies: [...s.agent.studies, study] },
        })),

      addDriftAlert: (alert) =>
        set((s) => {
          const driftAlerts = [...s.agent.driftAlerts, alert]
          if (driftAlerts.length > 50) driftAlerts.shift()
          return { agent: { ...s.agent, driftAlerts } }
        }),

      // Morph Kernel actions
      addMorphArtifact: (id, artifact) =>
        set((s) => ({
          morphKernel: {
            ...s.morphKernel,
            artifacts: { ...s.morphKernel.artifacts, [id]: artifact },
          },
        })),

      addMorphContract: (id, contract) =>
        set((s) => ({
          morphKernel: {
            ...s.morphKernel,
            contracts: { ...s.morphKernel.contracts, [id]: contract },
          },
        })),

      logMorphEvolution: (entry) =>
        set((s) => ({
          morphKernel: {
            ...s.morphKernel,
            evolutionLog: [...s.morphKernel.evolutionLog, { ...entry, timestamp: Date.now() }],
          },
        })),

      setMorphGates: (gates) =>
        set((s) => ({
          morphKernel: {
            ...s.morphKernel,
            activeGates: new Set(gates),
          },
        })),

      setMorphChannels: (channels) =>
        set((s) => ({
          morphKernel: {
            ...s.morphKernel,
            activeChannels: new Set(channels),
          },
        })),

      setConsciousnessLevel: (level) =>
        set((s) => ({
          morphKernel: { ...s.morphKernel, consciousnessLevel: level },
        })),

      initBody: () => {
        const saved = localStorage.getItem('resonance_agent')
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            set((s) => ({
              agent: { ...s.agent, ...parsed },
            }))
          } catch (e) {
            console.error('Failed to load agent state:', e)
          }
        }
      },
    }),
    {
      name: 'resonance-body-storage',
      partialize: (state) => ({
        files: state.files,
        installedApps: state.installedApps,
        chatHistory: state.chatHistory,
        agent: {
          purposeVector: state.agent.purposeVector,
          humanTrajectory: state.agent.humanTrajectory.slice(-100),
          agentTrajectory: state.agent.agentTrajectory.slice(-100),
          driftAlerts: state.agent.driftAlerts.slice(-20),
          observations: state.agent.observations.slice(-200),
          studies: state.agent.studies,
          papers: state.agent.papers,
          successLog: state.agent.successLog.slice(-50),
          memoryGraph: state.agent.memoryGraph,
        },
        githubToken: state.githubToken,
        tridentUrl: state.tridentUrl,
        tridentKey: state.tridentKey,
        supabaseUrl: state.supabaseUrl,
        supabaseKey: state.supabaseKey,
        morphKernel: {
          artifacts: state.morphKernel.artifacts,
          contracts: state.morphKernel.contracts,
          evolutionLog: state.morphKernel.evolutionLog,
        },
      }),
    }
  )
)
