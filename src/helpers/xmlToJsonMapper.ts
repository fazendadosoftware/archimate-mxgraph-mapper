import { readFile } from 'fs/promises'
import { Parser } from 'xml2js'
import isEqual from 'lodash.isequal'
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
  Link,
  Diagram
} from '../types'

const EXPORTER = 'Enterprise Architect'
const EXPORTER_VERSION = '6.5'
const MODEL = { name: 'EA_Model', type: 'uml:Model', visibility: 'public' }
const EXTENDER = { extender: 'Enterprise Architect', extenderID: '6.5' }

export const mapOwnedComment = (input: any) => {
  const { $ = null } = input
  if ($ === null) throw Error(`invalid ownedComment: ${JSON.stringify(input)}`)
  const { 'xmi:id': id, 'xmi:type': type, body = '' } = $ ?? {}
  if (Object.keys($).length > 3) throw Error(`more keys in ownedComment ${JSON.stringify(Object.keys($))}`)
  if (id === null || type !== 'uml:Comment') throw Error(`invalid ownedComment ${JSON.stringify(input)}`)
  const ownedComment: OwnedComment = { id, body }
  return ownedComment
}

export type PackagedElementIndex = Record<string, PackagedElement>

export const packagedElementReducer = (accumulator: PackagedElementIndex, _packagedElement: any) => {
  let {
    parent = null,
    hierarchyLevel = 0,
    $: { 'xmi:id': id = null, 'xmi:type': type = null, name = null },
    ownedComment: ownedComments = [],
    packagedElement: packagedElements = []
  } = _packagedElement ?? {}
  if (id === null || type === null) throw Error(`invalid packagedElement: ${JSON.stringify(_packagedElement)}`)
  const childLevel = typeof hierarchyLevel === 'number' ? hierarchyLevel + 1 : 0
  const children = packagedElements.map(({ $: { 'xmi:id': id = null } }) => id) as string[]
  packagedElements = packagedElements.map((packagedElement: any) => ({ ...packagedElement, hierarchyLevel: childLevel, parent: id, children: children }))

  accumulator = packagedElements.reduce(packagedElementReducer, accumulator)

  const packagedElement: PackagedElement = {
    id,
    hierarchyLevel,
    type,
    name,
    parent,
    children,
    ownedComments: (ownedComments as any[]).map(mapOwnedComment)
  }
  accumulator[packagedElement.id] = packagedElement
  return accumulator
}

/*
export const mapPackagedElement = (_packagedElement: any): PackagedElement => {
  // we skip ownedAttribute and packagedElements from the destructuration
  const {
    $: { 'xmi:id': id = null, 'xmi:type': type = null, name = null },
    ownedComment: ownedComments = [],
    packagedElement: packagedElements = []
  } = _packagedElement ?? {}
  if (id === null || type === null || name === null) throw Error(`invalid packagedElement: ${JSON.stringify(_packagedElement)}`)

  const packagedElement: PackagedElement = {
    id,
    type,
    name,
    ownedComments: (ownedComments as any[]).map(mapOwnedComment)
  }
  return packagedElement
}
*/

const mapModel = (xmi: any) => {
  const { $ = {}, ..._models } = xmi?.['uml:Model']?.[0] ?? {}
  const { name, visibility, 'xmi:type': type } = $
  if (!isEqual(MODEL, { name, visibility, type })) throw Error('invalid model')
  const model = Object.entries(_models)
    .reduce(({ packagedElementIndex, elementIndex, archiMate3Index }: Model, [key, values]: [string, any]) => {
      if (key === 'packagedElement') packagedElementIndex = values.reduce(packagedElementReducer, packagedElementIndex)
      else if (key.startsWith('ArchiMate3:ArchiMate_')) {
        const [prefix, archimate3Type] = key.split('_')
        if (prefix !== 'ArchiMate3:ArchiMate') throw Error(`invalid component prefix: ${key}`)
        const { type: archimate3Category, ids }: { type: string, ids: Set<string>} = values
          .map(({ $ }: any) => Object.entries($)[0])
          .map(([type, id]: any) => ({ type: type.split('_')[1], id }))
          .reduce(({ type, ids }: { type: string, ids: Set<string> }, { type: t, id }: { type: string, id: string }) => {
            if (type === '') type = t
            else if (type !== t) throw Error('multiple types in component')
            ids.add(id)
            return { type, ids }
          }, { type: '', ids: new Set<string>() })
        if (archiMate3Index[archimate3Category] === undefined) archiMate3Index[archimate3Category] = []
        if (!archiMate3Index[archimate3Category].includes(archimate3Type)) archiMate3Index[archimate3Category].push(archimate3Type)
        for (const elementID of [...ids] as string[]) {
          if (elementIndex[elementID] !== undefined) throw Error(`collision with elementID ${elementID}`)
          elementIndex[elementID] = { id: elementID, category: archimate3Category, type: archimate3Type }
        }
      } else {
        console.warn(`ignoring component prefix: ${key}`)
      }
      return { packagedElementIndex, elementIndex, archiMate3Index }
    }, { packagedElementIndex: {}, elementIndex: {}, archiMate3Index: {} })
  model.archiMate3Index = Object.entries(model.archiMate3Index)
    .reduce((accumulator, [archimate3Category, archimate3Types]) => ({ ...accumulator, [archimate3Category]: archimate3Types.sort() }), {})
  return model
}

const mapExtensionElement = (_element: any) => {
  // skipped properties: code, extendedProperties, flags, model, packageproperties, paths, project
  // properties, style, , tags, times
  let { $, links: [links] = [null] } = _element ?? {}
  const { name = null, 'xmi:idref': id = null, 'xmi:type': type = null } = $
  if (links !== null) {
    links = Object.entries<Array<{ $: any }>>(links)
      .reduce((accumulator: any[], [type, links]) => {
        links.forEach(({ $: { 'xmi:id': id, end, start } }) => accumulator.push({ id, type, end, start }))
        return accumulator
      }, [])
  }
  const element: ExtensionElement = { id, type, name, links }
  return element
}

const allowedDirections = ['Source -> Destination', 'Destination -> Source', 'Unspecified']
const mapExtensionConnector = (_connector: any) => {
  // skipped properties: code, extendedProperties, flags, model, packageproperties, paths, project
  // properties, style, , tags, times
  let {
    $: { 'xmi:idref': id },
    labels: [{ $: { mb: label } = { mb: '' } }],
    properties: [{ $: { direction = 'Unspecified', ea_type: eaType, stereotype } }],
    source: [{ $: { 'xmi:idref': sourceID = null } }],
    target: [{ $: { 'xmi:idref': targetID = null } }]
  } = _connector ?? {}
  label = label.replace(/[^a-zA-Z_]/g, '')
  const connector: ExtensionConnector = { id, label, direction, eaType, stereotype, sourceID, targetID }
  if (!allowedDirections.includes(direction)) throw Error(`invalid connector direction: ${JSON.stringify(connector)}`)
  if (sourceID === null || targetID === null) throw Error(`invalid connector, source or target IDS are null: ${JSON.stringify(connector)}`)
  return connector
}

const mapDiagramElement = (_diagramElement: any) => {
  let { $: { geometry = null, seqno, subject = null } } = _diagramElement ?? {}
  if (typeof subject !== 'string') throw Error(`invalid diagram element subject: ${JSON.stringify(_diagramElement)}`)
  const { Left: x0 = null, Right: x1 = null, Bottom: y1 = null, Top: y0 = null } = geometry.replace(/;/g, ' ').trim().split(' ')
    .reduce((accumulator: any, vertex: string) => {
      const [coordinate, value] = vertex.split('=')
      accumulator[coordinate] = parseInt(value)
      return accumulator
    }, {})
  const rect = x0 == null ? null : { x0, y0, width: x1 - x0, height: y1 - y0 }
  if (typeof geometry !== 'string') throw Error(`invalid diagram element geometry: ${JSON.stringify(_diagramElement)}`)
  if (typeof seqno === 'string') {
    seqno = parseInt(seqno)
    if (isNaN(seqno)) throw Error(`invalid diagram element seqno: ${JSON.stringify(_diagramElement)}`)
  }
  const element: ExtensionDiagramElement = { id: subject, seqno, geometry, rect }
  return element
}

const mapExtensionDiagram = (_diagram: any) => {
  let {
    $: { 'xmi:id': id },
    elements: [{ element: elements }],
    project: [{ $: { author, created, modified, version } }],
    properties: [{ $: { name, type } }]
  } = _diagram
  elements = elements.map(mapDiagramElement)
  const project: ExtensionDiagramProject = { author, created, modified, version }
  const diagram: ExtensionDiagram = { id, name, type, elements, project }
  return diagram
}

const mapExtension = (xmi: any) => {
  const { $: { extender = '', extenderID = '' } = {}, ..._extensions } = xmi?.['xmi:Extension']?.[0] ?? {}
  if (!isEqual(EXTENDER, { extender, extenderID })) throw Error('invalid model')
  // skipped properties: primitivetypes, profiles
  let {
    connectors: [{ connector: connectors }] = [],
    diagrams: [{ diagram: diagrams }] = [],
    elements: [{ element: elements }] = []
  } = _extensions
  if (!Array.isArray(elements)) throw Error(`invalid extensions: ${JSON.stringify(_extensions)}`)
  elements = elements.map(mapExtensionElement)
  connectors = connectors.map(mapExtensionConnector)
  diagrams = diagrams.map(mapExtensionDiagram)
  const extension: Extension = { extender, extenderID, connectors, diagrams, elements }
  return extension
}

export const getXmlFromFile = async (filePath: string) => await readFile(filePath, 'utf8').then(new Parser().parseStringPromise) as unknown

export const mapDocumentation = (xmi: any): Documentation => {
  const { $ } = xmi?.['xmi:Documentation']?.[0] ?? {}
  const { exporter = '', exporterID = '', exporterVersion = '' } = $
  if (exporter !== EXPORTER) throw Error(`invalid exporter: got ${exporter as string}, expected ${EXPORTER}`)
  if (exporterVersion !== EXPORTER_VERSION) throw Error(`invalid exporter version: got ${exporterVersion as string}, expected ${EXPORTER_VERSION}`)
  if (exporterID === '') throw Error(`invalid exporter ID: ${exporterID as string}`)
  const documentation: Documentation = { exporter, exporterVersion, exporterID }
  return documentation
}

export const mapExportedDocument = (rawDocument: any): ExportedDocument => {
  if (typeof rawDocument !== 'object' || rawDocument === null || rawDocument?.['xmi:XMI'] === undefined) throw Error('invalid raw document')
  const xmi = rawDocument['xmi:XMI']
  const documentation = mapDocumentation(xmi)
  const model = mapModel(xmi)
  const extension = mapExtension(xmi)
  const extensionElementIndex = extension.elements
    .reduce((accumulator: Record<string, ExtensionElement>, element) => {
      accumulator[element.id] = element
      return accumulator
    }, {})

  // we need to create a link index from elements
  const diagrams = extension.diagrams
    .map(extensionDiagram => {
      const elements = extensionDiagram.elements
        .map(diagramElement => {
          const { [diagramElement.id]: { type = null, category = null } = { type: null, category: null } } = model.elementIndex
          const {
            [diagramElement.id]: { hierarchyLevel, parent, children } = { hierarchyLevel: 0, parent: null, children: null }
          } = model.packagedElementIndex
          const { [diagramElement.id]: { name = null, links = null } = {} } = extensionElementIndex
          const element: Element = { ...diagramElement, type, category, name, hierarchyLevel, parent, children, links }
          return element
        }).sort(({ hierarchyLevel: A }, { hierarchyLevel: B }) => A > B ? 1 : A < B ? -1 : 0)
      const diagramElementIds = new Set(elements.map(({ id }) => id))
      const linkIndex = elements
        .reduce((accumulator: Record<string, Link>, element) => {
          accumulator = (element?.links ?? []).reduce((accumulator, link) => {
            const { start, end } = link
            const isExternal = !(diagramElementIds.has(start) && diagramElementIds.has(end))
            return { ...accumulator, [link.id]: { ...link, isExternal } }
          }, accumulator)
          return accumulator
        }, {})
      const links = Object.values(linkIndex)
      const diagram: Diagram = { ...extensionDiagram, elements, links }
      return diagram
    })
  const { archiMate3Index } = model
  const exportedDocument: ExportedDocument = { ...documentation, diagrams, archiMate3Index }
  return exportedDocument
}
