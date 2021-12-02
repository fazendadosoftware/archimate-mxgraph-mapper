import { Visibility, AssociationId, Aggregation, ActivityId } from './types.d'

export interface OwnedAttribute {
  // Expected type for the OwnedAttribute object
  type: 'uml:Property'
  // ownedAttribute id
  id: string
  visibility: Visibility
  association: AssociationId
  _type: ActivityId
  isStatic: boolean
  isReadOnly: boolean
  isDerived: boolean
  isOrdered: boolean
  isUnique: boolean
  isDerivedUnion: boolean
  aggregation: Aggregation
}
