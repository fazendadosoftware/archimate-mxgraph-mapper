import { OwnedComment } from './ownedComment'
import { UMLType, ElementId } from './types.d'

export interface PackagedElement {
  // PackagedElement uml type
  type: UMLType
  id: ElementId
  parent: ElementId
  children: ElementId[]
  hierarchyLevel: number
  name: string
  ownedComments: OwnedComment[]
  ownedBehaviors: any[]
  ownedAttributes?: null // skipped property
  memberEnds?: null // skipped property
  ownedEnd?: null // skipped property
  nestedClassifier?: null // skipped property
  packagedElements?: PackagedElement[] // skipped property
}

export type PackagedElementIndex = Record<string, PackagedElement>
