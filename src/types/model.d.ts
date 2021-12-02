import { Visibility } from './types.d'

export interface Model {
  // Expected model type
  type: 'uml:Model'
  // Expected model name
  name: 'EA_Model'
  visibility: Visibility
}
