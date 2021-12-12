import { Element } from './element.d'
import { Connector } from './connector'
import { ExtensionDiagram } from './extensionDiagram.d'

export interface Diagram extends ExtensionDiagram {
  elements: Element[]
  connectors: Connector[]
}
