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

export interface ExtensionDiagramElement {
  id: string
  seqno?: number
  geometry: string
  rect: null | RectGeometry
}

export interface ExtensionDiagramProject {
  author: string
  created: string
  modified: string
  version: string
}
