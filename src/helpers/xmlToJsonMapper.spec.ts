import {
  getXmlFromFile,
  mapExportedDocument
} from './xmlToJsonMapper'
import {
  ExportedDocument
} from '../types'

const EXPORTED_XML_FILE_PATH = './test/data/TestExport.xml'

describe('parsing the exported xml file', () => {
  let rawDocument: any
  let document: ExportedDocument

  test('exported document has the correct structure', async () => {
    rawDocument = await getXmlFromFile(EXPORTED_XML_FILE_PATH)
    document = mapExportedDocument(rawDocument)
    expect(document.exporter).toBe('Enterprise Architect')
    expect(document.exporterID).toBe('1554')
    expect(document.exporterVersion).toBe('6.5')
    expect(typeof document.model).toBe('object')
    expect(Array.isArray(document.diagrams)).toBe(true)

    expect(typeof document.model.archiMate3Index).toBe('object')
    expect(typeof document.model.elementIndex).toBe('object')
    expect(typeof document.model.packagedElementIndex).toBe('object')
  })

  test('exported document has the correct diagrams structure', async () => {
    // index of element ids -> [diagram ids]
    const exportedDiagramElementIndex = document.diagrams
      .reduce((accumulator: Record<string, string[]>, diagram) => {
        diagram.elements.forEach(element => {
          if (accumulator[element.id] === undefined) accumulator[element.id] = []
          if (!accumulator[element.id].includes(diagram.id)) accumulator[element.id].push(diagram.id)
        })
        return accumulator
      }, {})
    document.diagrams
      .forEach(diagram => {
        expect(typeof diagram.id).toBe('string')
        expect(typeof diagram.name).toBe('string')
        expect(typeof diagram.type).toBe('string')
        expect(typeof diagram.project).toBe('object')
        expect(typeof diagram.project.author).toBe('string')
        expect(typeof diagram.project.version).toBe('string')
        expect(typeof diagram.project.created).toBe('string')
        expect(typeof diagram.project.modified).toBe('string')
        expect(Array.isArray(diagram.elements)).toBe(true)
        expect(Array.isArray(diagram.links)).toBe(true)
        diagram.elements.forEach(element => {
          expect(typeof element.id).toBe('string')
          expect(typeof element.id).toBeTruthy()
          expect(element).toHaveProperty('name')
          expect(element).toHaveProperty('type')
          expect(element).toHaveProperty('category')
          expect(element).toHaveProperty('parent')
          expect(element).toHaveProperty('children')
          expect(element).toHaveProperty('seqno')
          expect(typeof element.hierarchyLevel).toBe('number')
          expect(typeof element.geometry).toBe('string')
          if (element.rect !== null) {
            expect(typeof element.rect.x0).toBe('number')
            expect(typeof element.rect.y0).toBe('number')
            expect(typeof element.rect.width).toBe('number')
            expect(typeof element.rect.height).toBe('number')
          }
        })

        const diagramElementIds = diagram.elements.map(({ id }) => id)

        diagram.links.forEach(link => {
          expect(typeof link.id).toBe('string')
          expect(typeof link.type).toBe('string')
          expect(typeof link.end).toBe('string')
          expect(typeof link.start).toBe('string')
          expect(typeof link.isExternal).toBe('boolean')
          if (link.isExternal === false) {
            expect(diagramElementIds.includes(link.start)).toBe(true)
            expect(diagramElementIds.includes(link.end)).toBe(true)
          } else {
            const startNodeInDiagram = diagramElementIds.includes(link.start) === true ? 1 : 0
            const endNodeInDiagram = diagramElementIds.includes(link.end) === true ? 1 : 0
            // only one node in the link should belong to the diagram
            expect(startNodeInDiagram + endNodeInDiagram).toEqual(1)
            const externalElementId = startNodeInDiagram === 0 ? link.start : link.end
            const externalElementInOtherDiagrams = exportedDiagramElementIndex[externalElementId]
            const externalElementIsPackagedElement = document.model.packagedElementIndex[externalElementId]
            const externalElementInModel = document.model.elementIndex[externalElementId]
            // external element id should be indexed in model element index
            if (externalElementInOtherDiagrams === undefined) {
              console.log('jijiji')
            }
            expect(externalElementInOtherDiagrams).not.toBeUndefined()
          }
        })
      })
  })
})
