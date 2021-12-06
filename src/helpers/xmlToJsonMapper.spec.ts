import { mapExportedDocument } from './xmlToJsonMapper'
import { ExportedDocument } from '../types'
import { readFile } from 'fs/promises'

const EXPORTED_XML_FILE_PATH = './test/data/TestExport.xml'

describe('parsing the exported xml file', () => {
  let document: ExportedDocument

  test('exported document has the correct structure', async () => {
    const fileContent = await readFile(EXPORTED_XML_FILE_PATH, 'utf-8')
    document = await mapExportedDocument(fileContent)
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
        expect(Array.isArray(diagram.connectors)).toBe(true)
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

        diagram.connectors.forEach(connector => {
          expect(typeof connector.id).toBe('string')
          expect(connector).toHaveProperty('type')
          expect(connector).toHaveProperty('category')
          if (connector.type === null) expect(connector.category).toBe(null)
          if (typeof connector.type === 'string') expect(typeof connector.type).toBe('string')
          expect(typeof connector.end).toBe('string')
          expect(typeof connector.start).toBe('string')
          expect(typeof connector.isExternal).toBe('boolean')
          if (connector.isExternal === false) {
            expect(diagramElementIds.includes(connector.start)).toBe(true)
            expect(diagramElementIds.includes(connector.end)).toBe(true)
          } else {
            const startNodeInDiagram = diagramElementIds.includes(connector.start) ? 1 : 0
            const endNodeInDiagram = diagramElementIds.includes(connector.end) ? 1 : 0
            // only one node in the link should belong to the diagram
            expect(startNodeInDiagram + endNodeInDiagram).toEqual(1)
          }
        })
      })
  })
})
