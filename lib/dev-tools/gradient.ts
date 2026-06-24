export interface ColorStop {
  id: string
  color: string
  position: number // 0–100
}

export type GradientType = 'linear' | 'radial' | 'conic'

export interface GradientState {
  type: GradientType
  angle: number
  stops: ColorStop[]
}

export function buildCss(state: GradientState): string {
  const sorted = [...state.stops].sort((a, b) => a.position - b.position)
  const stopStr = sorted.map(s => `${s.color} ${s.position}%`).join(', ')
  if (state.type === 'linear') return `linear-gradient(${state.angle}deg, ${stopStr})`
  if (state.type === 'radial') return `radial-gradient(circle, ${stopStr})`
  return `conic-gradient(from ${state.angle}deg, ${stopStr})`
}

export const PRESETS: Array<{ name: string; state: GradientState }> = [
  {
    name: 'Sunset',
    state: { type: 'linear', angle: 135, stops: [{ id: 'a', color: '#f97316', position: 0 }, { id: 'b', color: '#ec4899', position: 100 }] },
  },
  {
    name: 'Ocean',
    state: { type: 'linear', angle: 180, stops: [{ id: 'a', color: '#06b6d4', position: 0 }, { id: 'b', color: '#3b82f6', position: 100 }] },
  },
  {
    name: 'Forest',
    state: { type: 'linear', angle: 45, stops: [{ id: 'a', color: '#22c55e', position: 0 }, { id: 'b', color: '#16a34a', position: 100 }] },
  },
  {
    name: 'Violet',
    state: { type: 'linear', angle: 135, stops: [{ id: 'a', color: '#8b5cf6', position: 0 }, { id: 'b', color: '#ec4899', position: 100 }] },
  },
  {
    name: 'Gold',
    state: { type: 'linear', angle: 90, stops: [{ id: 'a', color: '#fbbf24', position: 0 }, { id: 'b', color: '#f59e0b', position: 100 }] },
  },
  {
    name: 'Midnight',
    state: { type: 'linear', angle: 180, stops: [{ id: 'a', color: '#1e1b4b', position: 0 }, { id: 'b', color: '#312e81', position: 50 }, { id: 'c', color: '#4f46e5', position: 100 }] },
  },
  {
    name: 'Rose',
    state: { type: 'radial', angle: 0, stops: [{ id: 'a', color: '#fda4af', position: 0 }, { id: 'b', color: '#be123c', position: 100 }] },
  },
  {
    name: 'Aurora',
    state: { type: 'conic', angle: 0, stops: [{ id: 'a', color: '#34d399', position: 0 }, { id: 'b', color: '#60a5fa', position: 33 }, { id: 'c', color: '#a78bfa', position: 66 }, { id: 'd', color: '#34d399', position: 100 }] },
  },
  {
    name: 'Charcoal',
    state: { type: 'linear', angle: 135, stops: [{ id: 'a', color: '#374151', position: 0 }, { id: 'b', color: '#111827', position: 100 }] },
  },
  {
    name: 'Neon',
    state: { type: 'linear', angle: 90, stops: [{ id: 'a', color: '#22d3ee', position: 0 }, { id: 'b', color: '#a855f7', position: 50 }, { id: 'c', color: '#f43f5e', position: 100 }] },
  },
]
