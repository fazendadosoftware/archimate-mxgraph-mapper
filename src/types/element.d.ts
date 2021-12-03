export type ElementID = string
export type ArchiMate3Category = string
export type ArchiMate3Type = string

export interface Element {
  id: ElementID
  type: ArchiMate3Type
  category: ArchiMate3Category
}
