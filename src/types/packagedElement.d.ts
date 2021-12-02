import { OwnedComment } from './ownedComment'
import { UMLType, ElementId } from './types.d'

export interface PackagedElement {
  // PackagedElement uml type
  type: UMLType
  id: ElementId
  name: string
  ownedComments: OwnedComment[]
  ownedAttributes?: null // skipped property
  memberEnds?: null // skipped property
  ownedEnd?: null // skipped property
  nestedClassifier?: null // skipped property
  packagedElements?: PackagedElement[] // skipped property
}
