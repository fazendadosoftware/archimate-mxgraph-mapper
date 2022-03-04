export interface Connector {
  id: string
  category: string | null
  type: string | null
  start: string
  end: string
  // link connects elements belonging to different diagrams
  isExternal: boolean | null
  direction: string
}
