import { Documentation } from './documentation.d'
import { Model } from './model.d'
import { PackagedElement } from './packagedElement'
import { OwnedComment } from './ownedComment'
import { OwnedAttribute } from './ownedAttribute'
import { Element } from './element.d'
export { Documentation, Model, PackagedElement, OwnedComment, OwnedAttribute, Element }

export interface ExportDocument {
  documentation?: Documentation
  model: Model
  extension?: any
}
