import { Parser } from 'xml2js'
import isEqual from 'lodash.isequal'
import { expose } from 'comlink'
import {
  ExportedDocument,
  Documentation,
  Model,
  PackagedElement,
  OwnedComment,
  ExtensionElement,
  ExtensionConnector,
  ExtensionDiagram,
  ExtensionDiagramProject,
  ExtensionDiagramElement,
  Extension,
  Element,
  Connector,
  Diagram,
  CoordinatePoint
} from '../types'

export enum ConnectorDirection {
  DIRECT = 'Source -> Destination',
  REVERSE = 'Destination -> Source',
  BIDIRECTIONAL = 'Bi-Directional',
  UNSPECIFIED = 'Unspecified'
}

const EXPORTER = 'Enterprise Architect'
const EXPORTER_VERSION = '6.5'
const MODEL = { name: 'EA_Model', type: 'uml:Model', visibility: 'public' }
const EXTENDER = { extender: 'Enterprise Architect', extenderID: '6.5' }

const mapId = (id: string) => id.replaceAll('_', '-')

export const mapOwnedComment = (input: any) => {
  const { $ = null } = input
  if ($ === null) throw Error(`invalid ownedComment: ${JSON.stringify(input)}`)
  let { 'xmi:id': id, 'xmi:type': type, body = '' } = $ ?? {}
  id = mapId(id)
  if (Object.keys($).length > 3) throw Error(`more keys in ownedComment ${JSON.stringify(Object.keys($))}`)
  if (id === null || type !== 'uml:Comment') throw Error(`invalid ownedComment ${JSON.stringify(input)}`)
  const ownedComment: OwnedComment = { id, body }
  return ownedComment
}

export const mapOwnedBehavior = (input: any) => {
  const { $ = null } = input
  if ($ === null) throw Error(`invalid ownedBehavior: ${JSON.stringify(input)}`)
  let { 'xmi:id': id } = $ ?? {}
  id = mapId(id)
  return id
}

export type PackagedElementIndex = Record<string, PackagedElement>

export const packagedElementReducer = (accumulator: PackagedElementIndex, _packagedElement: any) => {
  let {
    parent = null,
    hierarchyLevel = 0,
    $: { 'xmi:id': id = null, 'xmi:type': type = null, name = null },
    ownedBehavior: ownedBehaviors = [],
    ownedComment: ownedComments = [],
    packagedElement: packagedElements = [],
    nestedClassifier: nestedClassifiers = []
  } = _packagedElement ?? {}
  if (id === null || type === null) throw Error(`invalid packagedElement: ${JSON.stringify(_packagedElement)}`)
  id = mapId(id)
  const childLevel = typeof hierarchyLevel === 'number' ? hierarchyLevel + 1 : 0
  const children = [...packagedElements, ...nestedClassifiers].map(({ $: { 'xmi:id': id = null } }) => id !== null ? mapId(id) : id) as string[]
  packagedElements = [...packagedElements, ...nestedClassifiers].map((packagedElement: any) => ({ ...packagedElement, hierarchyLevel: childLevel, parent: id, children: children }))

  accumulator = packagedElements.reduce(packagedElementReducer, accumulator)

  const packagedElement: PackagedElement = {
    id,
    hierarchyLevel,
    type,
    name,
    parent,
    children,
    ownedBehaviors: ownedBehaviors.map(mapOwnedBehavior),
    ownedComments: (ownedComments as any[]).map(mapOwnedComment)
  }

  accumulator[packagedElement.id] = packagedElement
  return accumulator
}

const mapModel = (xmi: any) => {
  const { $ = {}, ..._models } = xmi?.['uml:Model']?.[0] ?? {}
  const { name, visibility, 'xmi:type': type } = $
  if (!isEqual(MODEL, { name, visibility, type })) throw Error('invalid model')
  const model = Object.entries(_models)
    .reduce(({ packagedElementIndex, elementIndex, archiMate3Index, unknownIndex }: Model, [key, values]: [string, any]) => {
      if (key === 'packagedElement') packagedElementIndex = values.reduce(packagedElementReducer, packagedElementIndex)
      else if (key.startsWith('ArchiMate3:ArchiMate_')) {
        const archiMate3Type = key.replace('ArchiMate3:', '')
        const { type: archimate3Category, ids }: { type: string, ids: Set<string>} = values
          .map(({ $ }: any) => Object.entries($)[0])
          .map(([type, id]: any) => ({ type: type.split('_')[1], id }))
          .reduce(({ type, ids }: { type: string, ids: Set<string> }, { type: t, id }: { type: string, id: string }) => {
            if (type === '') type = t
            else if (type !== t) throw Error('multiple types in component')
            ids.add(mapId(id))
            return { type, ids }
          }, { type: '', ids: new Set<string>() })
        if (archiMate3Index[archimate3Category] === undefined) archiMate3Index[archimate3Category] = []
        if (!archiMate3Index[archimate3Category].includes(archiMate3Type)) archiMate3Index[archimate3Category].push(archiMate3Type)
        for (const elementID of [...ids] as string[]) {
          if (elementIndex[elementID] !== undefined) throw Error(`collision with elementID ${elementID}`)
          elementIndex[elementID] = { id: elementID, category: archimate3Category, type: archiMate3Type }
        }
      } else {
        unknownIndex[key] = Array.isArray(values) ? values.map(({ $ }: any = {}) => $) : values
        console.warn(`ignoring component prefix: ${key}`)
      }
      return { packagedElementIndex, elementIndex, archiMate3Index, unknownIndex }
    }, { packagedElementIndex: {}, elementIndex: {}, archiMate3Index: {}, unknownIndex: {} })
  model.archiMate3Index = Object.entries(model.archiMate3Index)
    .reduce((accumulator, [archimate3Category, archimate3Types]) => ({ ...accumulator, [archimate3Category]: archimate3Types.sort() }), {})
  return model
}

const mapExtensionElement = (_element: any, model: Model) => {
  // skipped properties: code, extendedProperties, flags, model, packageproperties, paths, project
  // properties, style, , tags, times
  let { $, links: [links] = [null] } = _element ?? {}
  const { name = null, 'xmi:idref': id = null, 'xmi:type': type = null } = $
  if (links !== null) {
    links = Object.entries<Array<{ $: any }>>(links)
      .reduce((accumulator: Connector[], [_category, links]) => {
        links
          .forEach(({ $: { 'xmi:id': id, end, start } }) => {
            id = mapId(id)
            start = mapId(start)
            end = mapId(end)
            const { [id]: { type = null, category = null } = {} } = model.elementIndex
            accumulator.push({
              id,
              category,
              type,
              end,
              start,
              isExternal: null,
              direction: ConnectorDirection.UNSPECIFIED,
              S: { x: 0, y: 0 },
              E: { x: 0, y: 0 },
              edge: null,
              mode: null,
              tree: null,
              path: [],
              styleParams: {},
              targetIsOwnedBehaviorOfSource: false
            })
          })
        return accumulator
      }, [])
  }
  const element: ExtensionElement = { id: mapId(id), type, name, connectors: links }
  return element
}
const allowedDirections = Object.values(ConnectorDirection)

const mapExtensionConnector = (_connector: any, model: Model) => {
  // skipped properties: code, extendedProperties, flags, model, packageproperties, paths, project
  // properties, style, , tags, times
  let {
    $: { 'xmi:idref': id },
    labels: [{ $: { mb: label } = { mb: '' } }],
    properties: [{ $: { direction = 'Unspecified', ea_type: category = null, stereotype: type = null } }],
    source: [{ $: { 'xmi:idref': sourceID = null } }],
    target: [{ $: { 'xmi:idref': targetID = null } }]
  } = _connector ?? {}
  if (typeof label === 'string') label = label.replace(/[^a-zA-Z_]/g, '')
  sourceID = mapId(sourceID)
  targetID = mapId(targetID)
  const { [sourceID]: source } = model.packagedElementIndex
  const targetIsOwnedBehaviorOfSource = (source?.ownedBehaviors ?? []).includes(targetID)
  const connector: ExtensionConnector = {
    id: mapId(id),
    label,
    direction,
    category,
    type,
    sourceID: mapId(sourceID),
    targetID: mapId(targetID),
    targetIsOwnedBehaviorOfSource
  }
  if (!allowedDirections.includes(direction)) throw Error(`invalid connector direction: ${JSON.stringify(connector)}`)
  if (sourceID === null || targetID === null) throw Error(`invalid connector, source or target IDS are null: ${JSON.stringify(connector)}`)
  return connector
}

const mapDiagramElement = (_diagramElement: any) => {
  let { $: { geometry = null, seqno, subject = null, style = null } } = _diagramElement ?? {}
  if (typeof subject !== 'string') throw Error(`invalid diagram element subject: ${JSON.stringify(_diagramElement)}`)
  if (typeof geometry !== 'string') throw Error(`invalid diagram element geometry: ${JSON.stringify(_diagramElement)}`)
  const id = mapId(subject)
  const {
    Left: x0 = null,
    Right: x1 = null,
    Bottom: y1 = null,
    Top: y0 = null,
    SX = null,
    SY = null,
    EX = null,
    EY = null,
    EDGE = null,
    path = []
  } = geometry.replace(/;/g, ' ').trim().split(' ')
    .reduce((accumulator: any, vertex: string) => {
      const [key, value] = vertex.split('=')
      if (key === 'Path') {
        const coords = value.split('$')
          .filter(pair => pair.length > 0)
          // y coordinate on sparx is inverted in relation to mxGraph
          .map(pair => { const [x, y] = pair.split(':'); return { x: parseInt(x), y: -parseInt(y) } })
        accumulator.path = coords
      } else accumulator[key] = parseInt(value)
      return accumulator
    }, {})
  const styleParams = style.replace(/;/g, ' ').trim().split(' ')
    .reduce((accumulator: Record<string, string>, vertex: string) => {
      const [key, value] = vertex.split('=')
      accumulator[key] = value
      return accumulator
    }, {})
  const mode = typeof styleParams.Mode === 'string' ? parseInt(styleParams.Mode) : null
  const tree = styleParams.TREE ?? null
  const S = SX !== null && SY !== null ? { x: SX, y: SY } : null
  const E = EX !== null && EY !== null ? { x: EX, y: EY } : null
  const rect = x0 == null ? null : { x0, y0, width: x1 - x0, height: y1 - y0 }
  if (typeof seqno === 'string') {
    seqno = parseInt(seqno)
    if (isNaN(seqno)) throw Error(`invalid diagram element seqno: ${JSON.stringify(_diagramElement)}`)
  }
  const element: ExtensionDiagramElement = { id, seqno, geometry, rect, S, E, edge: EDGE, mode, tree, path, styleParams }
  return element
}

const mapExtensionDiagram = (_diagram: any) => {
  let {
    $: { 'xmi:id': id },
    elements: [{ element: elements }] = [{ element: [] }],
    project: [{ $: { author = null, created = null, modified = null, version = null } }] = [{ $: {} }],
    properties: [{ $: { name = null, type = null } }] = [{ $: {} }]
  } = _diagram
  elements = elements.map(mapDiagramElement)
  const project: ExtensionDiagramProject = { author, created, modified, version }
  const diagram: ExtensionDiagram = { id, name, type, elements, project }
  return diagram
}

const mapExtension = (xmi: any, model: Model) => {
  const { $: { extender = '', extenderID = '' } = {}, ..._extensions } = xmi?.['xmi:Extension']?.[0] ?? {}
  if (!isEqual(EXTENDER, { extender, extenderID })) throw Error('invalid model')
  // skipped properties: primitivetypes, profiles
  let {
    connectors: [{ connector: connectors }] = [],
    diagrams: [{ diagram: diagrams }] = [],
    elements: [{ element: elements }] = []
  } = _extensions
  if (!Array.isArray(elements)) throw Error(`invalid extensions: ${JSON.stringify(_extensions)}`)
  elements = elements.map(element => mapExtensionElement(element, model))
  connectors = connectors.map((connector: any) => mapExtensionConnector(connector, model))
  diagrams = diagrams.map(mapExtensionDiagram)
  const extension: Extension = { extender, extenderID, connectors, diagrams, elements }
  return extension
}

export const mapDocumentation = (xmi: any): Documentation => {
  const { $ } = xmi?.['xmi:Documentation']?.[0] ?? {}
  const { exporter = '', exporterID = '', exporterVersion = '' } = $
  if (exporter !== EXPORTER) throw Error(`invalid exporter: got ${exporter as string}, expected ${EXPORTER}`)
  if (exporterVersion !== EXPORTER_VERSION) throw Error(`invalid exporter version: got ${exporterVersion as string}, expected ${EXPORTER_VERSION}`)
  // if (exporterID === '') throw Error(`invalid exporter ID: ${exporterID as string}`)
  const documentation: Documentation = { exporter, exporterVersion, exporterID }
  return documentation
}

export const mapExportedDocument = async (rawDocument: string): Promise<ExportedDocument> => {
  if (typeof rawDocument !== 'string') throw Error('invalid document type, must be string')
  rawDocument = await (new Parser().parseStringPromise(rawDocument))
  if (typeof rawDocument !== 'object' || rawDocument === null || rawDocument?.['xmi:XMI'] === undefined) throw Error('invalid raw document')
  const xmi = rawDocument['xmi:XMI']
  const documentation = mapDocumentation(xmi)
  const model = mapModel(xmi)
  const extension = mapExtension(xmi, model)
  const extensionElementIndex = extension.elements
    .reduce((accumulator: Record<string, ExtensionElement>, element) => {
      element = { ...element, id: mapId(element.id) }
      accumulator[element.id] = element
      return accumulator
    }, {})

  const connectorDirectionIndex = extension.connectors
    .reduce((accumulator: Record<string, string>, connector) => {
      accumulator[connector.id] = connector.direction
      return accumulator
    }, {})
  const connectorTargetIsOwnedBehaviorIndex = extension.connectors
    .reduce((accumulator: Record<string, boolean>, connector) => {
      accumulator[connector.id] = connector.targetIsOwnedBehaviorOfSource
      return accumulator
    }, {})

  // we need to create a link index from elements
  const diagrams = extension.diagrams
    .map(extensionDiagram => {
      extensionDiagram = { ...extensionDiagram, id: mapId(extensionDiagram.id) }
      const elementIndex = extensionDiagram.elements
        .reduce((accumulator: Record<string, Element>, diagramElement) => {
          diagramElement = { ...diagramElement, id: mapId(diagramElement.id) }
          const { [diagramElement.id]: { type = null, category = null } = { type: null, category: null } } = model.elementIndex
          const {
            [diagramElement.id]: { hierarchyLevel, parent, children } = { hierarchyLevel: 0, parent: null, children: null }
          } = model.packagedElementIndex
          const { [diagramElement.id]: { name = null, connectors = null } = {} } = extensionElementIndex
          const isOmmited = false
          const notes: string[] = []
          const element: Element = { ...diagramElement, type, category, name, hierarchyLevel, parent, children, connectors, isOmmited, notes }
          accumulator[element.id] = element
          return accumulator
        }, {})

      const connectorIndex = Object.values(elementIndex)
        .reduce((accumulator: Record<string, Connector>, element) => {
          element = { ...element, id: mapId(element.id) }
          accumulator = (element?.connectors ?? []).reduce((accumulator, connector) => {
            const indexedElement = elementIndex[connector.id] ?? null
            let S = null
            let E = null
            let edge = null
            let mode = null
            let tree = null
            let path: CoordinatePoint[] = []
            let styleParams = {}
            if (indexedElement !== null) ({ S = null, E = null, edge = null, path = [], styleParams = {}, mode, tree } = indexedElement)
            else {
              // console.log('unknwon connector', connector)
            }
            const { start, end } = connector
            const isExternal = !(elementIndex[start] !== undefined && elementIndex[end] !== undefined)
            const direction = connectorDirectionIndex[connector.id]
            const targetIsOwnedBehaviorOfSource = connectorTargetIsOwnedBehaviorIndex[connector.id]
            accumulator[connector.id] = {
              ...connector,
              direction,
              isExternal,
              S,
              E,
              edge,
              mode,
              tree,
              path,
              styleParams,
              targetIsOwnedBehaviorOfSource
            }
            return accumulator
          }, accumulator)
          return accumulator
        }, {})

      const elements = Object.values(elementIndex)
        .filter(element => connectorIndex[element.id] === undefined)
        .map(element => {
          if (element.type === null) element.notes.push('element has no type')
          if (element.name === null) element.notes.push('element has no name')
          if (element.rect === null) element.notes.push('element has no geometry')
          element = { ...element, isOmmited: element.notes.length > 0 }
          return element
        })
        .sort(({ seqno: A = 0 }, { seqno: B = 0 }) => A > B ? -1 : A < B ? 1 : 0)

      const connectors = Object.values(connectorIndex)
      const diagram: Diagram = { ...extensionDiagram, elements, connectors }
      return diagram
    })
  const exportedDocument: ExportedDocument = { ...documentation, diagrams, model }
  return exportedDocument
}

export interface IMapperWorker {
  mapExportedDocument: (rawDocument: string) => Promise<ExportedDocument>
}

expose({ mapExportedDocument })
