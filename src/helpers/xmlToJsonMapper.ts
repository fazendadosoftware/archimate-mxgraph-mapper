import { readFile } from 'fs/promises'
import { Parser } from 'xml2js'
import isEqual from 'lodash.isequal'
import { ExportDocument, Documentation, Model, PackagedElement, OwnedComment } from '../types'

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

export const mapPackagedElement = (input: any): PackagedElement => {
  // we skip ownedAttribute and packagedElements from the destructuration
  const { $ = {}, ownedComment: ownedComments = [] } = input ?? {}
  const { 'xmi:id': id = null, 'xmi:type': type = null, name = null } = $
  if (id === null || type === null || name === null) throw Error(`invalid packagedElement: ${JSON.stringify(input)}`)
  const packagedElement: PackagedElement = {
    id,
    type,
    name,
    ownedComments: (ownedComments as any[]).map(mapOwnedComment)
  }
  return packagedElement
}

const mapModel = (xmi: any) => {
  const { $ = {}, ..._models } = xmi?.['uml:Model']?.[0] ?? {}
  const { name, visibility, 'xmi:type': type } = $
  if (!isEqual(MODEL, { name, visibility, type })) throw Error('invalid model')
  const model = Object.entries(_models)
    .reduce(({ packagedElementIndex, elementIndex, archimate3Index }: Model, [key, values]: [string, any]) => {
      if (key === 'packagedElement') {
        packagedElementIndex = values?.map(mapPackagedElement)
          .reduce((accumulator: PackagedElement[], packagedElement: PackagedElement) => ({ ...accumulator, [packagedElement.id]: packagedElement }), packagedElementIndex)
      } else if (key.startsWith('ArchiMate3:ArchiMate_')) {
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
        if (archimate3Index[archimate3Category] === undefined) archimate3Index[archimate3Category] = []
        if (!archimate3Index[archimate3Category].includes(archimate3Type)) archimate3Index[archimate3Category].push(archimate3Type)
        for (const elementID of [...ids] as string[]) {
          if (elementIndex[elementID] !== undefined) throw Error(`collision with elementID ${elementID}`)
          elementIndex[elementID] = { id: elementID, category: archimate3Category, type: archimate3Type }
        }
      } else {
        console.warn(`ignoring component prefix: ${key}`)
      }
      return { packagedElementIndex, elementIndex, archimate3Index }
    }, { packagedElementIndex: {}, elementIndex: {}, archimate3Index: {} })
  model.archimate3Index = Object.entries(model.archimate3Index)
    .reduce((accumulator, [archimate3Category, archimate3Types]) => ({ ...accumulator, [archimate3Category]: archimate3Types.sort() }), {})
  return model
}

const mapExtension = (xmi: any) => {
  const { $: { extender = '', extenderID = '' } = {}, ..._extensions } = xmi?.['xmi:Extension']?.[0] ?? {}
  if (!isEqual(EXTENDER, { extender, extenderID })) throw Error('invalid model')
  const {
    connectors: [{ connector: connectors }] = [],
    diagrams: [{ diagram: diagrams }] = [],
    elements: [{ element: elements }] = []
    // primitivetypes,
    // profiles
  } = _extensions
  return { connectors, diagrams, elements }
}

const ExportDocumentKeyMappings: Record<keyof ExportDocument, (xmi: any) => any> = {
  documentation: (xmi: any) => xmi?.['xmi:Documentation']?.[0]?.$,
  model: mapModel,
  extension: mapExtension
}

export const getXmlFromFile = async (filePath: string) => await readFile(filePath, 'utf8').then(new Parser().parseStringPromise) as unknown

export const validateDocumentation = (documentation?: Documentation): Documentation => {
  if (documentation === undefined || typeof documentation !== 'object') throw Error('invalid documentation')
  const { exporter = '', exporterID = '', exporterVersion = '' } = documentation
  if (exporter !== EXPORTER) throw Error(`invalid exporter: got ${exporter}, expected ${EXPORTER}`)
  if (exporterVersion !== EXPORTER_VERSION) throw Error(`invalid exporter version: got ${exporterVersion}, expected ${EXPORTER_VERSION}`)
  if (exporterID === '') throw Error(`invalid exporter ID: ${exporterID}`)
  return documentation
}

export const mapDocument = (document: any): ExportDocument => {
  if (typeof document !== 'object' || document === null || document?.['xmi:XMI'] === undefined) throw Error('invalid object')
  const xmi = document['xmi:XMI']
  // @ts-expect-error
  const rawDocument = Object.entries(ExportDocumentKeyMappings)
    .reduce((accumulator: ExportDocument, [key, mapFn]) => ({ ...accumulator, [key]: mapFn(xmi) }), {}) as ExportDocument
  let { documentation, extension, model } = rawDocument
  documentation = validateDocumentation(documentation)
  if (documentation === undefined) throw Error('invalid documentation')
  return { documentation, extension, model }
}
