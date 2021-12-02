import { Documentation } from './documentation.d'
import { Model } from './model.d'
import { PackagedElement } from './packagedElement'
import { OwnedComment } from './ownedComment'
import { OwnedAttribute } from './ownedAttribute'
export { Documentation, Model, PackagedElement, OwnedComment, OwnedAttribute }

export interface RawDocument {
  documentation?: Documentation
  model?: Model
  extension?: any
}

export interface Document {
  documentation: Documentation
  model: Model
}
