export interface ExtensionDiagram {
  id: string
  name: string
  type: string
  project: ExtensionDiagramProject
  elements: ExtensionDiagramElement[]
}

export interface RectGeometry {
  x0: number
  y0: number
  width: number
  height: number
}

export interface CoordinatePoint {
  x: number
  y: number
}

export interface ExtensionDiagramElement {
  id: string
  seqno?: number
  geometry: string
  rect: null | RectGeometry
  edge: 1 | 2 | 3 | 4 | null
  mode: number | null
  tree: string | null
  S: null | CoordinatePoint
  E: null | CoordinatePoint
  path: CoordinatePoint[]
  styleParams: Record<string, string>
}

export interface ExtensionDiagramProject {
  author: string
  created: string
  modified: string
  version: string
}
