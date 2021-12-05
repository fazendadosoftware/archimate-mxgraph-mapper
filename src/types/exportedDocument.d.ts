import { ArchiMate3Category, ArchiMate3Type } from './modelElement.d'
import { Diagram } from './diagram.d'
import { Documentation } from './documentation.d'

export interface ExportedDocument extends Documentation {
  diagrams: Diagram[]
  archiMate3Index: Record<ArchiMate3Category, ArchiMate3Type[]>
}
