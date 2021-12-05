import { Link } from './link'
export interface ExtensionElement {
  id: string
  type: string
  name?: string
  links: Link[] | null
}
