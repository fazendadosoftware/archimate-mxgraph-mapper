export interface Link {
  id: string
  type: string
  start: string
  end: string
  // link connects elements belonging to different diagrams
  isExternal: boolean
}
