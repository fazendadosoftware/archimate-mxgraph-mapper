import { PackagedElementIndex } from './packagedElement'
import { Element, ElementID, ArchiMate3Category, ArchiMate3Type } from './element.d'

export interface Model {
  packagedElementIndex: PackagedElementIndex
  elementIndex: Record<ElementID, Element>
  archimate3Index: Record<ArchiMate3Category, ArchiMate3Type[]>
}
