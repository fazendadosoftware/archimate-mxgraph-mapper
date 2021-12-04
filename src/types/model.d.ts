import { PackagedElementIndex } from './packagedElement'
import { ModelElement, ModelElementID, ArchiMate3Category, ArchiMate3Type } from './modelElement.d'

export type ModelElementIndex = Record<ModelElementID, ModelElement>
export interface Model {
  packagedElementIndex: PackagedElementIndex
  elementIndex: ModelElementIndex
  archimate3Index: Record<ArchiMate3Category, ArchiMate3Type[]>
}
