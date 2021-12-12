export const enum ExtensionConnectorDirections {
  SOURCE_DESTINATION = 'Source -> Destination',
  DESTINATION_SOURCE = 'Destination -> Source',
  UNSPECIFIED = 'Unspecified'
}

export interface ExtensionConnector {
  id: string
  label?: string
  direction: 'Source -> Destination' | 'Destination -> Source' | 'Unspecified'
  category: string | null
  type: string | null
  sourceID: string
  targetID: string
}
