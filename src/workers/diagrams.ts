import { Parser } from 'xml2js'
import { expose } from 'comlink'
import { mapExportedDocument } from '../helpers/xmlToJsonMapper'
const { parseStringPromise } = new Parser()

const sortElements = (elementA: IElement, elementB: IElement, connectorTree: Record<string, number>) => {
  const depthA = connectorTree[elementA.id] ?? 0
  const depthB = connectorTree[elementB.id] ?? 0
  let parentScore = 0
  if ((elementA.id === elementB.parentId) || (elementA.parentId === null && elementB.parentId !== null)) parentScore = 1
  else if ((elementA.parentId === elementB.id) || (elementB.parentId === null && elementA.parentId !== null)) parentScore = -1
  if (parentScore !== 0) return parentScore

  const depthScore = depthA > depthB ? 1 : depthA < depthB ? -1 : 0
  return depthScore
}

const getParentIndex = (document: any): Record<string, IElement> => {
  const { 'xmi:XMI': { 'uml:Model': [rootElement] } } = document

  const unrollPackagedElements = (element = {} as any, parentId = null, index = {} as any) => {
    let { $: { 'xmi:id': id = null } = {}, packagedElement: packagedElements = [] } = element
    if (typeof id === 'string') id = mapId(id)
    if (parentId !== null && id !== null) index[id] = parentId
    index = packagedElements.reduce((accumulator: any, element: any) => ({ ...accumulator, ...unrollPackagedElements(element, id, index) }), index)
    return index
  }

  const parentIndex = unrollPackagedElements(rootElement)
  return parentIndex
}

const mapId = (id: string = ''): string => id.replace(/^([A-Z]{4}_)/, '').replace(/_/g, '-').trim()

export async function getDiagrams (xml: string) {
  console.log('GETTING THE DIAGRAMS...')
  const rawDocument = await parseStringPromise(xml)
  const _document = mapExportedDocument(rawDocument)
  if (rawDocument['xmi:XMI'] === undefined) throw Error('invalid xml')
  const {
    'xmi:XMI': {
      'xmi:Extension': [{
        diagrams: [{ diagram: _diagrams = [] } = { diagram: [] }],
        elements: [{ element: _elements = [] } = { element: [] }],
        connectors: [{ connector: _connectors = [] } = { connector: [] }]
      } = { diagrams: [], elements: [], connectors: [] }] = []
    }
  } = rawDocument

  const elements = _elements as IElement[]
  const connectors = _connectors as IConnector[]

  const parentIndex = getParentIndex(document)

  const elementStereotypeIndex = elements
    .reduce((accumulator: any, element: any) => {
      let { $: { 'xmi:idref': id }, properties: [{ $: { stereotype = null, documentation = null } }] } = element
      id = mapId(id)
      accumulator[id] = { stereotype, documentation }
      return accumulator
    }, {})

  const { connectorIndex, elementIndex } = connectors
    .reduce((accumulator: any, connector: any) => {
      try {
        let { $: { 'xmi:idref': id }, extendedProperties = [], source: [source], target: [target] } = connector
        id = mapId(id)
        let type = ''
        if (typeof extendedProperties[0] === 'object') ([{ $: { conditional: type = '' } }] = extendedProperties)
        let { $: { 'xmi:idref': sourceId = null } } = source
        let { $: { 'xmi:idref': targetId = null } } = target
        sourceId = mapId(sourceId)
        targetId = mapId(targetId)

        type = type.replace(/[^\w\s]/gi, '').replace(/\r?\n|\r/g, '').trim()
        accumulator.connectorIndex[id] = { id, sourceId, targetId, type }
        if (sourceId === 'EAID_AABFC2BF_A3E9_4a32_8A96_4A76B806D40A' || targetId === 'EAID_AABFC2BF_A3E9_4a32_8A96_4A76B806D40A') {
          console.log('MISSING ELEMENT HAS CONNECTOR', { id, sourceId, targetId, type })
        }
        for (const element of [source, target]) {
          const { $: { 'xmi:idref': _id }, model: [{ $: { type, name } }] } = element
          const id = mapId(_id as string)
          const { [id]: { stereotype, documentation } = {} as any } = elementStereotypeIndex
          const parentId = parentIndex[id] ?? null
          accumulator.elementIndex[id] = { id, parentId, type: stereotype ?? type, name: name ?? documentation }
        }
      } catch (error) {
        console.error('getDiagrams', error)
        throw error
      }
      return accumulator
    }, { connectorIndex: {}, elementIndex: {} })

  const diagrams: IDiagram[] = _diagrams
    .map((diagram: any, idx: number) => {
      let {
        elements: [{ element: elements = [] } = {}] = [],
        properties: [{ $: properties }] = [],
        project: [{ $: project }] = []
      } = diagram
      let connectors
      ({ elements = [], connectors = [] } = elements
        .map(({ $ }: any) => $)
        .reduce((accumulator: any, element: any) => {
          let { subject = null, geometry = null as string | null } = element
          if (subject !== null) subject = mapId(subject)
          if (typeof geometry === 'string' && geometry !== '') {
            const { Left: x0 = null, Right: x1 = null, Bottom: y1 = null, Top: y0 = null } = geometry.replace(/;/g, ' ').trim().split(' ')
              .reduce((accumulator: any, vertex) => {
                const [coordinate, value] = vertex.split('=')
                accumulator[coordinate] = parseInt(value)
                return accumulator
              }, {})
            if (x0 !== null) element.geometry = [x0, y0, x1 - x0, y1 - y0]
          }
          if (properties.name === 'AutoCAD Architecture - Service interaction Diagram') {
            if (!(subject in elementIndex)) {
              const id = mapId(element.subject as string)
              const { [id]: { stereotype, documentation } = {} as any } = elementStereotypeIndex
              console.log('NO SUBJSCE', id, stereotype, documentation)
            }
          }
          if (subject in elementIndex) accumulator.elements.push({ ...elementIndex[subject], ...element })
          else if (subject in connectorIndex) accumulator.connectors.push({ ...connectorIndex[subject], ...element })
          return accumulator
        }, { elements: [], connectors: [] }))
      const connectorTree = buildConnectorTree(connectors)
      elements = elements.sort((A: IElement, B: IElement) => sortElements(A, B, connectorTree))
      return { id: idx, ...properties, ...project, elements, connectors }
    })
  return diagrams
}

const buildConnectorTree = (connectors: IConnector[]) => {
  const targetIdIndex = connectors
    .reduce((accumulator: Record<string, string[]>, connector) => {
      const { targetId, sourceId } = connector
      if (accumulator[targetId] === undefined) accumulator[targetId] = []
      accumulator[targetId].push(sourceId)
      return accumulator
    }, {})

  const getDepth = (targetId: string, targetIdIndex: Record<string, string[]>, depth: number = -1): any => {
    if (depth > 20) return -1
    depth++
    const sourceIds = targetIdIndex[targetId]
    if (sourceIds === undefined) return depth
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    else return Math.max(...sourceIds.map(id => getDepth(id, targetIdIndex, depth)))
  }

  const index = Object.entries(targetIdIndex)
    .reduce((accumulator: Record<string, number>, [targetId, sourceIds]) => {
      accumulator[targetId] = getDepth(targetId, targetIdIndex)
      return accumulator
    }, {})
  return index
}

export interface IElement {
  id: string
  parentId: string
  type: string
  name: string
  seqno: string
  geometry: number[]
  style: string
}

export interface IConnector {
  id: string
  sourceId: string
  targetId: string
  type: string
  subject: string
  geometry: string
  style: string
}

export interface IDiagram {
  id: number
  name: string
  documentation: string
  author: string
  created: string
  modified: string
  type: string
  version: string
  connectors: IConnector[]
  elements: IElement[]
}

export interface IXmlWorker {
  getDiagrams: (xml: string) => Promise<any>
}

expose({ getDiagrams })
