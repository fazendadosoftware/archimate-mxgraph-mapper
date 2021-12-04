export type ModelElementID = string
export type ArchiMate3Category = string
export type ArchiMate3Type = string

export interface ModelElement {
  id: ModelElementID
  type: ArchiMate3Type
  category: ArchiMate3Category
}
