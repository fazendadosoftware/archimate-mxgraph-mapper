import { Element } from './element.d'
import { Link } from './link.d'
import { ExtensionDiagram } from './extensionDiagram.d'

export interface Diagram extends ExtensionDiagram {
  elements: Element[]
  links: Link[]
}
