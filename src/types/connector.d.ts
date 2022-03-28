import { CoordinatePoint } from './extensionDiagram'

export interface Connector {
  id: string
  category: string | null
  type: string | null
  start: string
  end: string
  // link connects elements belonging to different diagrams
  isExternal: boolean | null
  direction: string
  edge: 1 | 2 | 3 | 4 | null
  mode: number | null
  tree: string | null
  S: CoordinatePoint | null
  E: CoordinatePoint | null
  path: CoordinatePoint[]
  targetIsOwnedBehaviorOfSource: boolean
  styleParams: Record<string, string>
}
