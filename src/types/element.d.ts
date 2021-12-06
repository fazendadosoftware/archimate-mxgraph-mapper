import { ExtensionDiagramElement } from './extensionDiagram'
import { ArchiMate3Type, ArchiMate3Category } from './modelElement.d'
import { Connector } from './connector.d'

export interface Element extends ExtensionDiagramElement {
  name: string | null
  category: ArchiMate3Category | null
  type: ArchiMate3Type | null
  hierarchyLevel: number
  parent: string | null
  children: string[] | null
  connectors: Connector[] | null
}
