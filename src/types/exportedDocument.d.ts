import { Model } from './model.d'
import { Diagram } from './diagram.d'
import { Documentation } from './documentation.d'

export interface ExportedDocument extends Documentation {
  file: { name: string, path: string, size: number, lastModified: number }
  diagrams: Diagram[]
  model: Model
}
