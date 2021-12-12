import { Connector } from './connector'
export interface ExtensionElement {
  id: string
  type: string
  name?: string
  connectors: Connector[] | null
}
