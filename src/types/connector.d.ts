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
  sourcePoint: CoordinatePoint | null
  targetPoint: CoordinatePoint | null
}
