import { Model } from './model.d'
import { Diagram } from './diagram.d'
import { Documentation } from './documentation.d'

export interface ExportedDocument extends Documentation {
  diagrams: Diagram[]
  model: Model
}
