import { ExtensionConnector } from './extensionConnector'
import { ExtensionDiagram } from './extensionDiagram'
import { ExtensionElement } from './extensionElement'
export interface Extension {
  extender: string
  extenderID: string
  connectors: ExtensionConnector[]
  diagrams: ExtensionDiagram[]
  elements: ExtensionElement[]
}
