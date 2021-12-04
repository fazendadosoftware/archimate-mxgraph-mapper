import { Model } from './model.d'
import { Documentation } from './documentation.d'

export interface ExportedDocument extends Documentation {
  model: Model
  extension?: any
}
